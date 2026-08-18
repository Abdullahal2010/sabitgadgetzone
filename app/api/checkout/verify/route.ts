import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { verifyPayment } from '@/lib/deshipay';
import User from '@/lib/models/User';
import { notify } from '@/lib/notify';

// The ONLY place an order is ever marked paid. Called from the success
// page (with the transactionId DeshiPay put on the redirect) and again
// from the webhook handler as a reconciliation nudge — either caller
// lands here, and this always re-checks with DeshiPay directly rather
// than trusting whatever query string or webhook body triggered it.
export async function POST(request: NextRequest) {
  const { orderId, transactionId } = await request.json();
  if (!orderId || !transactionId) {
    return NextResponse.json({ error: 'orderId and transactionId are required' }, { status: 400 });
  }

  await connectToDatabase();

  const order = await Order.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Idempotency: if we've already confirmed this order, don't re-verify,
  // re-decrement stock, or re-increment sold — just report the cached
  // result. This makes it safe for the success page and the webhook to
  // both call this route for the same order.
  if (order.paymentStatus === 'completed') {
    return NextResponse.json({ paymentStatus: 'completed', orderStatus: order.status });
  }

  const result = await verifyPayment(transactionId);

  if (result.status === 'COMPLETED') {
    // Atomic guard: only the first call that finds paymentStatus still
    // 'pending' gets to apply side effects (stock/sold), even under
    // concurrent requests.
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, paymentStatus: 'pending' },
      {
        paymentStatus: 'completed',
        paymentTransactionId: transactionId,
        status: 'processing'
      },
      { new: true }
    );

    if (updated) {
      await Promise.all(
        updated.items.map((item: any) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { sold: item.quantity, stock: -item.quantity }
          })
        )
      );

      const buyer = await User.findOne({ phone: updated.userPhone }).select('_id email').lean<{
        _id: string;
        email: string;
      } | null>();
      if (buyer) {
        await notify({
          recipientId: String(buyer._id),
          recipientEmail: buyer.email,
          type: 'order_confirmed',
          title: 'Payment confirmed — your order is on its way',
          body: `Payment for order #${String(updated._id).slice(-6)} has been confirmed. It's now being processed.`,
          link: '/profile?tab=orders'
        });
      }
    }

    return NextResponse.json({ paymentStatus: 'completed', orderStatus: 'processing' });
  }

  if (result.status === 'PENDING') {
    return NextResponse.json({ paymentStatus: 'pending', orderStatus: order.status });
  }

  // ERROR, or an unexpected/false response — treat as failed, but don't
  // touch stock (nothing was ever reserved at checkout time).
  await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'pending' },
    { paymentStatus: 'failed', status: 'cancelled' }
  );
  return NextResponse.json({ paymentStatus: 'failed', orderStatus: 'cancelled' });
}
