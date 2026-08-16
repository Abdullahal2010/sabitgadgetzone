'use client';

export type ProfileTabId = 'overview' | 'orders' | 'settings' | 'status';

export const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'settings', label: 'Manage Account' },
  { id: 'status', label: 'Account Status' }
];

export default function ProfileTabs({
  active,
  onChange
}: {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
}) {
  return (
    <div className="rounded-xl2 border border-border bg-white p-2 shadow-card">
      <div className="flex gap-2 overflow-x-auto">
        {PROFILE_TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                isActive
                  ? 'bg-brand text-white shadow-card'
                  : 'bg-gradient-to-r from-brand-light to-bg text-navy/70 hover:text-brand'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
