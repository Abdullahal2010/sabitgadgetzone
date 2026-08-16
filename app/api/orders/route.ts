import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { isAdminAuthenticated } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/lib/models/Order';

// GET /api/orders            -> admin only: every order (used by API
//                                consumers; the /admin/orders page itself
//                                reads Mongo directly as a server component)
// GET /api/orders?phone=...  -> shopper: their OWN order history only.
//
// SECURITY: the `phone` query param is never trusted for a non-admin
// caller. A signed-in shopper's orders are looked up using the phone
// number on their verified session, not whatever the client happened to
// pass in the query string — otherwise anyone could read anyone else's
// order history just by changing the query param. Admins (verified via
// the signed admin_session cookie) may still pass ?phone= to look up a
// specific customer's orders.
//
// There is intentionally no POST here — orders are only ever created via
// /api/checkout/create-payment (which prices them from the database and
// starts a DeshiPay payment session) and confirmed via
// /api/checkout/verify. That keeps "order exists" and "sold/stock were
// touched" always tied to a verified payment, with no route that can
// create a shippable order for free.
export async function GET(request: NextRequest) {
  await connectToDatabase();

  if (await isAdminAuthenticated()) {
    const phone = request.nextUrl.searchParams.get('phone');
    const filter = phone ? { userPhone: phone } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders);
  }

  const session = await getServerSession(authOptions);
  const phone = (session?.user as any)?.phone;
  if (!phone) {
    return NextResponse.json({ error: 'Log in to view your orders' }, { status: 401 });
  }

  const orders = await Order.find({ userPhone: phone }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(orders);
}
