'use client';

import { useMemo, useState } from 'react';
import { Order } from '@/types';
import {
  BoxIcon,
  CalendarIcon,
  CardIcon,
  CheckCircleIcon,
  ClockIcon,
  CoinIcon,
  ConvertIcon,
  GiftIcon,
  WalletIcon,
  XCircleIcon
} from './icons';

function StatTile({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl2 border border-border p-4 ${tone}`}>
      <div>
        <p className="text-xs font-semibold text-navy/70">{label}</p>
        <p className="mt-1 font-mono text-xl font-extrabold text-navy">{value}</p>
      </div>
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/70 text-navy/70">
        {icon}
      </span>
    </div>
  );
}

export default function OverviewTab({ orders, walletBalance }: { orders: Order[]; walletBalance: number }) {
  const [showConvertNote, setShowConvertNote] = useState(false);

  const { weeklySpend, monthlySpend, totalSpend } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completed = orders.filter((o) => o.paymentStatus === 'completed');
    const weekly = completed
      .filter((o) => new Date(o.createdAt) >= startOfWeek)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const monthly = completed
      .filter((o) => new Date(o.createdAt) >= startOfMonth)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const total = completed.reduce((sum, o) => sum + (o.total || 0), 0);

    return { weeklySpend: weekly, monthlySpend: monthly, totalSpend: total };
  }, [orders]);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const totalCount = orders.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Financial overview */}
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-extrabold text-navy">Financial Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile
            label="Available Balance"
            value={`৳${walletBalance.toLocaleString()}`}
            icon={<WalletIcon className="h-4.5 w-4.5" />}
            tone="bg-brand-light"
          />
          <StatTile
            label="Weekly Spend"
            value={`৳${weeklySpend.toLocaleString()}`}
            icon={<CalendarIcon className="h-4.5 w-4.5" />}
            tone="bg-bg"
          />
          <StatTile
            label="Monthly Spend"
            value={`৳${monthlySpend.toLocaleString()}`}
            icon={<ClockIcon className="h-4.5 w-4.5" />}
            tone="bg-star/10"
          />
          <StatTile
            label="Total Spend"
            value={`৳${totalSpend.toLocaleString()}`}
            icon={<CardIcon className="h-4.5 w-4.5" />}
            tone="bg-[#F3E9FB]"
          />
        </div>
      </div>

      {/* Orders overview */}
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-brand" />
          <h2 className="text-lg font-extrabold text-navy">Orders Overview</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile
            label="Pending Orders"
            value={pendingCount.toLocaleString()}
            icon={<ClockIcon className="h-4.5 w-4.5" />}
            tone="bg-star/15"
          />
          <StatTile
            label="Completed Orders"
            value={completedCount.toLocaleString()}
            icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
            tone="bg-[#E4F9F1]"
          />
          <StatTile
            label="Cancelled Orders"
            value={cancelledCount.toLocaleString()}
            icon={<XCircleIcon className="h-4.5 w-4.5" />}
            tone="bg-bg"
          />
          <StatTile
            label="Total Orders"
            value={totalCount.toLocaleString()}
            icon={<BoxIcon className="h-4.5 w-4.5" />}
            tone="bg-pink-50"
          />
        </div>
      </div>

      {/* Coins — dummy for now, wired up once the coins system exists */}
      <div className="rounded-xl2 border border-border bg-white p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-navy">Coins</h2>
            <p className="text-xs text-muted">Coins will be added by admin as a Bonus</p>
          </div>
          <div className="flex items-center gap-2">
            {showConvertNote && <span className="text-xs font-semibold text-muted">Coming soon</span>}
            <button
              onClick={() => {
                setShowConvertNote(true);
                setTimeout(() => setShowConvertNote(false), 2500);
              }}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-star to-[#FF7A1A] px-4 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90"
            >
              Convert
              <ConvertIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Available Coins" value="0" icon={<CoinIcon className="h-4.5 w-4.5" />} tone="bg-star/10" />
          <StatTile
            label="Total Converted"
            value="0 Coins"
            icon={<ConvertIcon className="h-4.5 w-4.5" />}
            tone="bg-brand-light"
          />
          <StatTile
            label="Earnings via Coins"
            value="৳0"
            icon={<GiftIcon className="h-4.5 w-4.5" />}
            tone="bg-[#F3E9FB]"
          />
        </div>
      </div>
    </div>
  );
}
