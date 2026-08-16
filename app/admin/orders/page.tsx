import { connectToDatabase } from '@/lib/mongodb';
import OrderModel from '@/lib/models/Order';
import { Order } from '@/types';
import AdminOrderRow from '@/components/AdminOrderRow';

export const dynamic = 'force-dynamic';

async function getOrders(): Promise<Order[]> {
  await connectToDatabase();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(orders));
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold text-navy">Orders ({orders.length})</h1>
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
              <AdminOrderRow key={order._id} order={order} />
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="py-6 text-center text-muted">No orders yet.</p>}
      </div>
    </div>
  );
}
