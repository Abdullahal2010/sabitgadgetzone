import { connectToDatabase } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { Order } from '@/types';
import AdminOrderRow from '@/components/AdminOrderRow';
import { getSessionUser } from '@/lib/serverAuth';
import { canViewOrders, canChangeOrderStatus } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getOrders(isAdmin: boolean): Promise<Order[]> {
  await connectToDatabase();
  // Moderators only ever see unresolved orders — delivered/cancelled
  // orders drop out of their queue the moment they're resolved (per
  // product spec); only admins retain full history.
  const filter = isAdmin ? {} : { status: { $nin: ['delivered', 'cancelled'] } };
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

export default async function AdminOrdersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canViewOrders(sessionUser)) {
    redirect('/admin/products');
  }

  const isAdmin = sessionUser.role === 'admin';
  const orders = await getOrders(isAdmin);
  const canEditStatus = canChangeOrderStatus(sessionUser);

  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold text-navy">Orders ({orders.length})</h1>
      {!isAdmin && (
        <p className="mb-4 text-xs text-muted">
          Showing unresolved orders only — delivered and cancelled orders are handled by admins.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl2 border border-border bg-white p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th className="pb-2 pr-3">Order</th>
              <th className="pb-2 pr-3">Customer</th>
              <th className="pb-2 pr-3">Items</th>
              <th className="pb-2 pr-3">Total</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <AdminOrderRow key={order._id} order={order} canEditStatus={canEditStatus} />
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="py-6 text-center text-muted">No orders yet.</p>}
      </div>
    </div>
  );
}
