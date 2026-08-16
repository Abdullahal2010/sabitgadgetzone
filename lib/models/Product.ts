import mongoose, { Schema, models, model } from 'mongoose';

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    buyPrice: { type: Number, default: 0 },
    imageUrl: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, default: 'General' },
    // Incremented whenever an order containing this product is placed —
    // see app/api/orders/route.ts.
    sold: { type: Number, default: 0 },
    // Denormalized from the Review collection (see lib/reviewAggregate.ts)
    // so product cards/listing pages can show rating + review count without
    // an extra join on every page load.
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default models.Product || model('Product', ProductSchema);
