import StarIcon from './StarIcon';
import { Review } from '@/types';

export default function ProductReviews({
  reviews,
  ratingAverage,
  ratingCount
}: {
  reviews: Review[];
  ratingAverage: number;
  ratingCount: number;
}) {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-extrabold text-navy">Ratings & reviews</h2>
        {ratingCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted">
            <StarIcon className="h-3.5 w-3.5 text-star" />
            {ratingAverage.toFixed(1)}/5 ({ratingCount})
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews yet — be the first to rate this product after your order ships.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review._id} className="rounded-xl2 border border-border p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-navy">{review.userName}</span>
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon key={n} filled={n <= review.rating} className="h-3.5 w-3.5 text-star" />
                  ))}
                </span>
              </div>
              {review.comment && <p className="text-sm text-navy/80">{review.comment}</p>}
              <p className="mt-1.5 text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
