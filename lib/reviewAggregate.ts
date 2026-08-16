import { Types } from 'mongoose';
import Review from './models/Review';
import Product from './models/Product';

/**
 * Recomputes and stores a product's average rating + review count on the
 * Product document itself, so product cards can read it directly (no join)
 * — see components/ProductCard.tsx. Call this after any review is
 * created or updated.
 */
export async function recomputeProductRating(productId: string) {
  const stats = await Review.aggregate([
    { $match: { productId: new Types.ObjectId(productId) } },
    { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const { average = 0, count = 0 } = stats[0] || {};

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: Math.round(average * 10) / 10,
    ratingCount: count
  });
}
