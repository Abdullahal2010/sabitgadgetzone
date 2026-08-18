import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { getSessionUser } from '@/lib/serverAuth';
import { canChangeOrderStatus } from '@/lib/permissions';
import { notify } from '@/lib/notify';

// PATCH /api/orders/:id — admin, or moderator with changeOrderStatus
// permission. Notifies the buyer (in-app + email) whenever their order's
// status actually changes.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canChangeOrderStatus(sessionUser)) {
    return NextResponse.json({ error: "You don't have permission to update orders" }, { status: 403 });
  }

  await connectToDatabase();
  const { status } = await request.json();
  const order = await Order.findByIdAndUpdate(params.id, { status }, { new: true });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const buyer = await User.findOne({ phone: order.userPhone }).select('_id email').lean<{
    _id: string;
    email: string;
  } | null>();

  if (buyer) {
    await notify({
      recipientId: String(buyer._id),
      recipientEmail: buyer.email,
      type: 'order_status_change',
      title: 'Your order status has been updated',
      body: `Order #${String(order._id).slice(-6)} is now "${status}".`,
      link: '/profile?tab=orders'
    });
  }

  return NextResponse.json(order);
}
