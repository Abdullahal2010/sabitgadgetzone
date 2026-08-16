import { Schema, models, model } from 'mongoose';

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userPhone: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    // Payment tracking is intentionally separate from `status` (shipping
    // state) above — an order can be paid but not yet shipped, and must
    // never be marked "processing"/shipped until payment is confirmed.
    paymentProvider: { type: String, default: 'deshipay' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentTransactionId: { type: String, index: true },
    paymentMethod: { type: String },
    paymentAmount: { type: Number },
    paymentFee: { type: Number },
    customerEmail: { type: String }
  },
  { timestamps: true }
);

export default models.Order || model('Order', OrderSchema);
