import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { recomputeProductRating } from '@/lib/reviewAggregate';

// GET /api/reviews?productId=...  -> public: every review for a product
//                                    (used on the product detail page)
// GET /api/reviews?mine=1         -> the signed-in shopper's own reviews
//                                    (used on /profile to show which
//                                    ordered items are already reviewed)
export async function GET(request: NextRequest) {
  await connectToDatabase();
  const productId = request.nextUrl.searchParams.get('productId');
  const mine = request.nextUrl.searchParams.get('mine');

  if (productId) {
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(reviews);
  }

  if (mine) {
    const session = await getServerSession(authOptions);
    const phone = (session?.user as any)?.phone;
    if (!phone) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const reviews = await Review.find({ userPhone: phone }).lean();
    return NextResponse.json(reviews);
  }

  return NextResponse.json({ error: 'productId or mine is required' }, { status: 400 });
}

// POST /api/reviews — create or update a review for one (order, product)
// pair. A shopper can only rate a product they actually ordered, and only
// once the admin has marked that order "shipped" (or further along,
// "delivered") — see the brief: "users will only be able to rate the
// product after the product is shipped from the admin side."
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const phone = (session?.user as any)?.phone;

  if (!phone) {
    return NextResponse.json({ error: 'Log in to leave a review' }, { status: 401 });
  }

  const { orderId, productId, rating, comment } = await request.json();

  if (!orderId || !productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'orderId, productId and a rating (1-5) are required' }, { status: 400 });
  }

  await connectToDatabase();

  const buyer = await User.findOne({ phone }).lean<{ name: string } | null>();

  const order = await Order.findById(orderId).lean<{
    userPhone: string;
    status: string;
    items: { productId: string }[];
  } | null>();

  if (!order || order.userPhone !== phone) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!['shipped', 'delivered'].includes(order.status)) {
    return NextResponse.json(
      { error: 'You can rate this product once your order has shipped.' },
      { status: 403 }
    );
  }
  if (!order.items.some((item) => String(item.productId) === String(productId))) {
    return NextResponse.json({ error: 'That product is not part of this order' }, { status: 400 });
  }

  const review = await Review.findOneAndUpdate(
    { orderId, productId },
    { orderId, productId, userPhone: phone, userName: buyer?.name || 'Verified buyer', rating, comment: comment || '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recomputeProductRating(productId);

  return NextResponse.json(review, { status: 201 });
}
