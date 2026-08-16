import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <AdminNav />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
