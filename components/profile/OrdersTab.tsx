'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Order, OrderStatus, Review } from '@/types';
import ProductReviewForm from '@/components/ProductReviewForm';

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-star/15 text-[#8a5b00]',
  processing: 'bg-brand-light text-brand-dark',
  shipped: 'bg-[#E7F0FF] text-[#2551C9]',
  delivered: 'bg-[#E4F9F1] text-[#0F9D6B]',
  cancelled: 'bg-red-50 text-red-500'
};

const PAYMENT_STYLES: Record<string, string> = {
  completed: 'bg-[#E4F9F1] text-[#0F9D6B]',
  pending: 'bg-star/15 text-[#8a5b00]',
  failed: 'bg-red-50 text-red-500'
};

const STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

function StatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Order cancelled
      </div>
    );
  }
  const currentIdx = STEPS.indexOf(status);
  return (
    <div className="flex items-center">
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-initial">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-brand text-white' : 'bg-border text-muted'
                }`}
              >
                {done ? '✓' : ''}
              </span>
              <span className={`whitespace-nowrap text-[10px] font-semibold capitalize ${done ? 'text-navy' : 'text-muted'}`}>
                {step}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <span className={`mx-1.5 h-0.5 flex-1 rounded ${idx < currentIdx ? 'bg-brand' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersTab({
  orders,
  ordersLoading,
  myReviews,
  onReviewSaved
}: {
  orders: Order[];
  ordersLoading: boolean;
  myReviews: Record<string, Review>;
  onReviewSaved: (orderId: string, productId: string, review: Review) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  return (
    <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-navy">Order History</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            const filterCount = f.value === 'all' ? orders.length : orders.filter((o) => o.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'border-brand bg-brand text-white shadow-card'
                    : 'border-border bg-bg text-muted hover:border-brand hover:text-brand'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-muted'}`}>({filterCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      {ordersLoading ? (
        <p className="text-muted">Loading orders…</p>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-border bg-bg p-8 text-center text-muted">
          {orders.length === 0 ? (
            <>
              No orders yet.{' '}
              <Link href="/" className="font-semibold text-brand">
                Start shopping
              </Link>
            </>
          ) : (
            'No orders match this filter.'
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => {
            const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            return (
              <div key={order._id} className="overflow-hidden rounded-xl2 border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">Order #{order._id.slice(-6)}</span>
                    <span className="text-xs text-muted">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.paymentStatus && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          PAYMENT_STYLES[order.paymentStatus] || 'bg-border text-muted'
                        }`}
                      >
                        Payment: {order.paymentStatus}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="px-4 pt-4">
                  <StatusStepper status={order.status} />
                </div>

                <ul className="mt-4 divide-y divide-border px-4">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex flex-col gap-1.5 py-3 first:pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-navy">
                          {item.title} <span className="text-muted">× {item.quantity}</span>
                        </span>
                        <span className="font-mono text-navy">৳{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      {['shipped', 'delivered'].includes(order.status) && (
                        <ProductReviewForm
                          orderId={order._id}
                          productId={item.productId}
                          productTitle={item.title}
                          existingReview={myReviews[`${order._id}_${item.productId}`]}
                          onSaved={(review) => onReviewSaved(order._id, item.productId, review)}
                        />
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-1.5 border-t border-border bg-bg px-4 py-3 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="font-mono">৳{subtotal.toLocaleString()}</span>
                  </div>
                  {order.paymentMethod && (
                    <div className="flex justify-between text-muted">
                      <span>Payment method</span>
                      <span className="font-semibold capitalize text-navy">{order.paymentMethod}</span>
                    </div>
                  )}
                  {order.paymentTransactionId && (
                    <div className="flex justify-between text-muted">
                      <span>Transaction ID</span>
                      <span className="font-mono text-xs text-navy">{order.paymentTransactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-navy">
                    <span>Total</span>
                    <span className="font-mono text-brand-dark">৳{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
