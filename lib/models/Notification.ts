import { Schema, models, model } from 'mongoose';

/**
 * One document per in-app notification. Populated by lib/notify.ts
 * whenever something notification-worthy happens to a user's account
 * (welcome, role change, ban/restriction, order placed/confirmed, order
 * status change, etc.) — see lib/notify.ts for the full trigger list.
 *
 * `read` drives the header bell's red dot: unread = dot shows. Opening the
 * popup (GET /api/notifications) marks everything returned as read in the
 * same request (see app/api/notifications/route.ts).
 *
 * `link`, when present, deep-links the popup entry to the relevant page
 * (e.g. a specific order) — optional because not every notification type
 * has an obvious destination (e.g. "your account was banned").
 */
const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'welcome',
        'role_change',
        'banned',
        'unbanned',
        'restriction_change',
        'order_placed',
        'order_confirmed',
        'order_status_change'
      ]
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1 });

export default models.Notification || model('Notification', NotificationSchema);
