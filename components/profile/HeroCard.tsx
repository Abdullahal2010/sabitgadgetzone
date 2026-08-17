'use client';

import { useState } from 'react';
import { AppUser } from '@/types';
import { initials, LogoutIcon, WalletIcon } from './icons';

export default function HeroCard({
  user,
  walletBalance,
  addMoney,
  onLogoutClick
}: {
  user: AppUser;
  walletBalance: number;
  addMoney: (amount: number) => void;
  onLogoutClick: () => void;
}) {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  function handleCustomAdd() {
    const amount = Number(customAmount);
    if (amount > 0) {
      addMoney(amount);
      setCustomAmount('');
      setShowAddMoney(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-navy via-brand-dark to-brand shadow-card-lg">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
        {/* Identity */}
        <div className="flex flex-1 items-center gap-4 text-white">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-extrabold">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-extrabold">{user.name}</p>
              <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-[#0F9D6B]/25 px-2 py-0.5 text-[11px] font-bold text-[#8CFFCB]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC97]" />
                Active
              </span>
            </div>
            <p className="mt-0.5 text-sm text-white/70">{user.phone}</p>
            <p className="mt-0.5 font-mono text-[11px] tracking-wide text-white/40">
              ID #{user._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Wallet panel — the "big white area" from the reference now hosts
            our own basic wallet functionality: balance + add money. */}
        <div className="w-full rounded-xl2 bg-white/10 p-4 backdrop-blur-sm lg:w-[340px] lg:flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-white/70">
              <WalletIcon className="h-4 w-4" />
              My Wallet
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
              Demo
            </span>
          </div>
          <p className="mt-1.5 font-mono text-2xl font-extrabold text-white">৳{walletBalance.toLocaleString()}</p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {!showAddMoney ? (
              <button
                onClick={() => setShowAddMoney(true)}
                className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-dark shadow-card transition hover:bg-white/90"
              >
                + Add Money
              </button>
            ) : (
              <div className="flex w-full flex-wrap items-center gap-1.5">
                {[500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      addMoney(amount);
                      setShowAddMoney(false);
                    }}
                    className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/25"
                  >
                    +৳{amount}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom"
                  className="w-20 rounded-full bg-white/15 px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/50 outline-none focus:bg-white/25"
                />
                <button
                  onClick={handleCustomAdd}
                  className="rounded-full bg-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/25"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddMoney(false)}
                  className="rounded-full px-2 py-1.5 text-[11px] font-semibold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-white/10 px-5 py-3 sm:px-6">
        <button
          onClick={onLogoutClick}
          className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 hover:text-red-200"
        >
          <LogoutIcon className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>
    </div>
  );
}
