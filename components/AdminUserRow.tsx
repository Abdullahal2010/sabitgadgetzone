import { AppUser } from '@/types';

export default function AdminUserRow({ user }: { user: AppUser }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-3 text-sm font-medium text-navy">{user.name}</td>
      <td className="py-2.5 pr-3 text-sm text-muted">{user.phone}</td>
      <td className="py-2.5 font-mono text-sm">৳{(user.walletBalance ?? 0).toLocaleString()}</td>
    </tr>
  );
}
