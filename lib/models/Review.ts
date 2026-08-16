import { Schema, models, model } from 'mongoose';

/**
 * One review = one rating + one comment, tied to a specific (order, product)
 * pair — not just (user, product) — so a shopper leaves one review per item
 * per order, and can only do so once that order has actually shipped (see
 * app/api/reviews/route.ts for the eligibility check).
 */
const ReviewSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, required: true, ref: 'Order' },
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    userPhone: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' }
  },
  { timestamps: true }
);

// A shopper can rate a given product once per order that contained it —
// resubmitting updates the same review (see the upsert in the API route).
ReviewSchema.index({ orderId: 1, productId: 1 }, { unique: true });

export default models.Review || model('Review', ReviewSchema);
