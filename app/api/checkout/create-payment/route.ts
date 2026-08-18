import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { createPayment } from '@/lib/deshipay';
import { getSessionUser } from '@/lib/serverAuth';
import { canShop } from '@/lib/permissions';
import { notify } from '@/lib/notify';

// Creates a pending Order priced from the database (never from whatever
// the browser sends), then asks DeshiPay for a hosted payment_url to
// redirect the customer to. Nothing is marked paid here — that only
// happens in /api/checkout/verify after a real server-to-server check.
export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Log in to check out' }, { status: 401 });
  }
  // Checked at the crucial moment — placing an order — against a fresh DB
  // read. Banned/restricted accounts can still browse and add to cart,
  // just can't complete checkout.
  if (!canShop(sessionUser)) {
    return NextResponse.json(
      { error: 'Your account is currently restricted from placing orders.' },
      { status: 403 }
    );
  }
  const phone = sessionUser.phone;

  const { items, cusEmail } = await request.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  await connectToDatabase();

  const buyer = await User.findOne({ phone }).lean<{ name: string; email?: string } | null>();
  const email = cusEmail || buyer?.email;
  if (!email) {
    return NextResponse.json({ error: 'An email address is required to pay' }, { status: 400 });
  }

  // Re-price every line from the database — client-sent prices are
  // ignored entirely, so nobody can tamper with the amount charged.
  const orderItems: { productId: string; title: string; price: number; quantity: number }[] = [];
  let total = 0;

  for (const line of items) {
    const product = await Product.findById(line.productId).lean<{ title: string; price: number; stock: number } | null>();
    if (!product) {
      return NextResponse.json({ error: 'One of the items in your cart no longer exists' }, { status: 400 });
    }
    const quantity = Math.max(1, Math.floor(Number(line.quantity) || 1));
    if (product.stock < quantity) {
      return NextResponse.json({ error: `${product.title} doesn't have enough stock left` }, { status: 400 });
    }
    orderItems.push({ productId: line.productId, title: product.title, price: product.price, quantity });
    total += product.price * quantity;
  }

  const order = await Order.create({
    userPhone: phone,
    items: orderItems,
    total,
    status: 'pending',
    paymentProvider: 'deshipay',
    paymentStatus: 'pending',
    customerEmail: email
  });

  const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  const result = await createPayment({
    cusName: buyer?.name || 'Customer',
    cusEmail: email,
    amount: total,
    successUrl: `${origin}/checkout/success?orderId=${order._id}`,
    cancelUrl: `${origin}/checkout/cancel?orderId=${order._id}`,
    webhookUrl: `${origin}/api/webhooks/deshipay`,
    metaData: { orderId: String(order._id) }
  });

  if (!result.status || !result.payment_url) {
    // Don't leave a dangling pending order the customer can never pay.
    await Order.findByIdAndDelete(order._id);
    return NextResponse.json({ error: result.message || 'Could not start payment' }, { status: 502 });
  }

  await notify({
    recipientId: sessionUser.id,
    recipientEmail: email,
    type: 'order_placed',
    title: 'Your order has been placed',
    body: `Order #${String(order._id).slice(-6)} for ৳${total.toLocaleString()} has been created and is awaiting payment confirmation.`,
    link: '/profile?tab=orders'
  });

  return NextResponse.json({ orderId: order._id, paymentUrl: result.payment_url });
}
