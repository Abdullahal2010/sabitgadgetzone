import Link from 'next/link';
import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import { Product } from '@/types';
import AdminProductRow from '@/components/AdminProductRow';
import { getSessionUser } from '@/lib/serverAuth';
import { canAddProduct, canEditProduct, canDeleteProduct } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<Product[]> {
  await connectToDatabase();
  const products = await ProductModel.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function AdminProductsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const products = await getProducts();
  const canAdd = canAddProduct(sessionUser);
  const canEdit = canEditProduct(sessionUser);
  const canDelete = canDeleteProduct(sessionUser);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-navy">Products ({products.length})</h1>
        {canAdd && (
          <Link href="/admin/products/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark">
            + Add product
          </Link>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl2 border border-border bg-white p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th className="pb-2 pr-3">Product</th>
              <th className="pb-2 pr-3">Price</th>
              <th className="pb-2 pr-3">Stock</th>
              <th className="pb-2 pr-3">Category</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <AdminProductRow key={product._id} product={product} canEdit={canEdit} canDelete={canDelete} />
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="py-6 text-center text-muted">No products yet.</p>}
      </div>
    </div>
  );
}
