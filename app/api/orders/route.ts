import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { getSessionUser } from '@/lib/serverAuth';
import { canViewOrders } from '@/lib/permissions';

// GET /api/orders            -> admin: every order.
// GET /api/orders?phone=...  -> admin: a specific customer's orders.
// GET /api/orders (moderator with viewOrders permission) -> every order
//     EXCEPT delivered/cancelled ones, which drop out of the moderator's
//     view once resolved (per product spec).
// GET /api/orders (anyone else, incl. a moderator without that permission)
//     -> their OWN order history only, resolved from their session — the
//     `phone` query param is never trusted for a non-admin caller, or
//     anyone could read anyone else's order history.
export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Log in to view your orders' }, { status: 401 });
  }

  await connectToDatabase();

  if (sessionUser.role === 'admin') {
    const phone = request.nextUrl.searchParams.get('phone');
    const filter = phone ? { userPhone: phone } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders);
  }

  if (sessionUser.role === 'moderator' && canViewOrders(sessionUser)) {
    // Once an order is delivered or cancelled/refunded, it's resolved and
    // disappears from the moderator's queue — only admins retain full
    // history (see the dashboard/full-list branch above).
    const orders = await Order.find({ status: { $nin: ['delivered', 'cancelled'] } })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(orders);
  }

  const orders = await Order.find({ userPhone: sessionUser.phone }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(orders);
}
