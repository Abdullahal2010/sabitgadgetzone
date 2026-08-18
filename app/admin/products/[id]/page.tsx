import { notFound, redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import { Product } from '@/types';
import ProductForm from '@/components/ProductForm';
import { getSessionUser } from '@/lib/serverAuth';
import { canEditProduct } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function getProduct(id: string): Promise<Product | null> {
  await connectToDatabase();
  try {
    const product = await ProductModel.findById(id).lean();
    return product ? JSON.parse(JSON.stringify(product)) : null;
  } catch {
    return null;
  }
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canEditProduct(sessionUser)) redirect('/admin/products');

  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-5 text-xl font-extrabold text-navy">Edit product</h1>
      <ProductForm mode="edit" initial={product} />
    </div>
  );
}
