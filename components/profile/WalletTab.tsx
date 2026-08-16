'use client';

import { useMemo, useState } from 'react';
import { AppUser, Order } from '@/types';
import { WalletIcon } from './icons';

export default function WalletTab({
  user,
  walletBalance,
  addMoney,
  orders
}: {
  user: AppUser;
  walletBalance: number;
  addMoney: (amount: number) => void;
  orders: Order[];
}) {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const paymentHistory = useMemo(
    () =>
      orders
        .filter((o) => o.paymentStatus)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'completed')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalFees = orders
    .filter((o) => o.paymentStatus === 'completed')
    .reduce((sum, o) => sum + (o.paymentFee || 0), 0);
  const completedCount = orders.filter((o) => o.paymentStatus === 'completed').length;

  function handleCustomAdd() {
    const amount = Number(customAmount);
    if (amount > 0) {
      addMoney(amount);
      setCustomAmount('');
      setShowAddMoney(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-navy via-brand-dark to-brand p-6 text-white shadow-card-lg">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white/70">
              <WalletIcon className="h-4 w-4" />
              My Wallet
            </div>
            <p className="mt-2 font-mono text-4xl font-extrabold tracking-tight">৳{walletBalance.toLocaleString()}</p>
            <p className="mt-1 font-mono text-xs tracking-[0.25em] text-white/50">
              •••• •••• •••• {user.phone.slice(-4)}
            </p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">Demo</span>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          {!showAddMoney ? (
            <button
              onClick={() => setShowAddMoney(true)}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-dark shadow-card transition hover:bg-white/90"
            >
              + Add Money
            </button>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-2">
              {[500, 1000, 2000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    addMoney(amount);
                    setShowAddMoney(false);
                  }}
                  className="rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/25"
                >
                  +৳{amount}
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom"
                  className="w-24 rounded-full bg-white/15 px-3 py-2 text-xs text-white placeholder:text-white/50 outline-none focus:bg-white/25"
                />
                <button
                  onClick={handleCustomAdd}
                  className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/25"
                >
                  Add
                </button>
              </div>
              <button
                onClick={() => setShowAddMoney(false)}
                className="rounded-full px-3 py-2 text-xs font-semibold text-white/60 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <p className="relative mt-3 text-[11px] text-white/50">
          UI-only demo balance — nothing is actually charged or transferred.
        </p>
      </div>

      {/* Wallet stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl2 border border-border bg-white p-4 shadow-card">
          <p className="text-xs font-semibold text-muted">Total Spent (paid orders)</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-brand-dark">৳{totalSpent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl2 border border-border bg-white p-4 shadow-card">
          <p className="text-xs font-semibold text-muted">Payment Fees Paid</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-navy">৳{totalFees.toLocaleString()}</p>
        </div>
        <div className="rounded-xl2 border border-border bg-white p-4 shadow-card">
          <p className="text-xs font-semibold text-muted">Successful Payments</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#0F9D6B]">{completedCount}</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-navy">Payment History</h2>
        {paymentHistory.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-border bg-bg p-8 text-center text-muted">
            No payment activity yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted">
                  <th className="pb-2 pr-3">Order</th>
                  <th className="pb-2 pr-3">Method</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((o) => (
                  <tr key={o._id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-mono text-xs text-muted">#{o._id.slice(-6)}</td>
                    <td className="py-2.5 pr-3 capitalize text-navy">{o.paymentMethod || o.paymentProvider || '—'}</td>
                    <td className="py-2.5 pr-3 font-mono font-bold text-brand-dark">
                      ৳{(o.paymentAmount ?? o.total).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          o.paymentStatus === 'completed'
                            ? 'bg-[#E4F9F1] text-[#0F9D6B]'
                            : o.paymentStatus === 'failed'
                              ? 'bg-red-50 text-red-500'
                              : 'bg-star/15 text-[#8a5b00]'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-muted">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
