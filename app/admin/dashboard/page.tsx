import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Link from 'next/link';
import { getSessionUser } from '@/lib/serverAuth';
import { canViewDashboardStats } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function getStats() {
  await connectToDatabase();
  const [productCount, orderCount, userCount, paidOrders] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    // Revenue only reflects orders whose payment DeshiPay has actually
    // confirmed — a pending, failed, or cancelled order was never paid,
    // so it must never count toward revenue.
    Order.find({ paymentStatus: 'completed' }).select('total').lean()
  ]);
  const revenue = paidOrders.reduce((sum, o: any) => sum + (o.total || 0), 0);
  return { productCount, orderCount, userCount, revenue };
}

export default async function AdminDashboardPage() {
  // Dashboard-wide stats (revenue, total counts) are admin-only — a
  // moderator hitting this URL directly is redirected to the one section
  // they do have: Products.
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canViewDashboardStats(sessionUser)) {
    redirect('/admin/products');
  }

  const stats = await getStats();

  const cards = [
    { label: 'Products', value: stats.productCount, href: '/admin/products' },
    { label: 'Orders', value: stats.orderCount, href: '/admin/orders' },
    { label: 'Users', value: stats.userCount, href: '/admin/users' },
    { label: 'Revenue', value: `৳${stats.revenue.toLocaleString()}`, href: '/admin/orders' }
  ];

  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold text-navy">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl2 border border-border bg-white p-5 shadow-card transition hover:shadow-card-lg"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-brand-dark">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/products/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark">
          + Add product
        </Link>
        <Link href="/admin/orders" className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-navy hover:bg-brand-light">
          View orders
        </Link>
        <Link href="/admin/users" className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-navy hover:bg-brand-light">
          Manage users
        </Link>
      </div>
    </div>
  );
}
