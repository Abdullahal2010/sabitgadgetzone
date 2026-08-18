'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrderRow({ order, canEditStatus }: { order: Order; canEditStatus: boolean }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(status: OrderStatus) {
    setUpdating(true);
    const res = await fetch(`/api/orders/${order._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setUpdating(false);
    if (res.ok) router.refresh();
    else alert('Failed to update order.');
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-3 font-mono text-xs text-muted">#{order._id.slice(-6)}</td>
      <td className="py-2.5 pr-3 text-sm text-navy">{order.userPhone}</td>
      <td className="py-2.5 pr-3 text-sm text-navy">
        {order.items.map((i) => `${i.title} ×${i.quantity}`).join(', ')}
      </td>
      <td className="py-2.5 pr-3 font-mono text-sm font-bold text-brand-dark">
        ৳{order.total.toLocaleString()}
      </td>
      <td className="py-2.5 pr-3">
        {canEditStatus ? (
          <select
            value={order.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="rounded-md border border-border px-2 py-1 text-xs capitalize outline-none focus:border-brand"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ) : (
          <span className="rounded-md bg-bg px-2 py-1 text-xs capitalize text-muted">{order.status}</span>
        )}
      </td>
      <td className="py-2.5 text-xs text-muted">{new Date(order.createdAt).toLocaleString()}</td>
    </tr>
  );
}
