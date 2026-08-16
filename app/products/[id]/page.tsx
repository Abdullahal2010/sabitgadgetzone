import { notFound } from 'next/navigation';
import Image from 'next/image';
import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/lib/models/Product';
import ReviewModel from '@/lib/models/Review';
import { Product, Review } from '@/types';
import AddToCartPanel from '@/components/AddToCartPanel';
import ProductReviews from '@/components/ProductReviews';

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

async function getReviews(productId: string): Promise<Review[]> {
  const reviews = await ReviewModel.find({ productId }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(reviews));
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();
  const reviews = await getReviews(params.id);

  return (
    <div className="rounded-xl2 border border-border bg-white p-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl2 bg-brand-light">
          <Image src={product.imageUrl} alt={product.title} fill sizes="500px" className="object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">{product.title}</h1>
          <p className="mt-2 font-mono text-2xl font-extrabold text-brand-dark">
            ৳{product.price.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-muted">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'} · {product.category}
            {(product.ratingCount ?? 0) > 0 && ` · ${(product.ratingAverage ?? 0).toFixed(1)}/5 (${product.ratingCount} ratings)`}
            {' · '}
            {product.sold ?? 0} sold
          </p>
          <p className="mt-4 leading-relaxed text-navy/80">{product.description}</p>
          <AddToCartPanel product={product} />
        </div>
      </div>

      <ProductReviews
        reviews={reviews}
        ratingAverage={product.ratingAverage ?? 0}
        ratingCount={product.ratingCount ?? 0}
      />
    </div>
  );
}
