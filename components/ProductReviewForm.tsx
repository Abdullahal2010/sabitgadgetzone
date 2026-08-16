'use client';

import { useState } from 'react';
import StarIcon from './StarIcon';
import { Review } from '@/types';

export default function ProductReviewForm({
  orderId,
  productId,
  productTitle,
  existingReview,
  onSaved
}: {
  orderId: string;
  productId: string;
  productTitle: string;
  existingReview?: Review;
  onSaved?: (review: Review) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, productId, rating, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your review.');
      setSaved(true);
      setOpen(false);
      onSaved?.(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isReviewed = Boolean(existingReview) || saved;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
      >
        {isReviewed ? (
          <>
            <StarIcon className="h-3.5 w-3.5 text-star" /> You rated {rating}/5 — edit review
          </>
        ) : (
          <>⭐ Rate & review {productTitle}</>
        )}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-bg p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
            aria-label={`Rate ${n} star`}
          >
            <StarIcon filled={n <= (hoverRating || rating)} className="h-5 w-5 text-star" />
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Share your experience with this product (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Submit review'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
