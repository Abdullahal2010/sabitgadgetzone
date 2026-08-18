import Notification from './models/Notification';
import { sendNotificationEmail } from './mailer';

type NotificationType =
  | 'welcome'
  | 'role_change'
  | 'banned'
  | 'unbanned'
  | 'restriction_change'
  | 'order_placed'
  | 'order_confirmed'
  | 'order_status_change';

/**
 * The single call site every route uses to notify a user of something —
 * writes the in-app Notification (drives the header bell) and fires the
 * matching email, in one call, so the two can never drift out of sync.
 *
 * Assumes connectToDatabase() has already been called by the caller (every
 * route that calls this already connects for its own reads/writes).
 *
 * The email send is fire-and-forget: awaited so a failure can be logged,
 * but wrapped in try/catch so an email-provider hiccup (rate limit, bad
 * config, etc.) never fails the parent action — a ban, an order, a role
 * change must always succeed even if the email doesn't go out.
 */
export async function notify(params: {
  recipientId: string;
  recipientEmail: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  const { recipientId, recipientEmail, type, title, body, link } = params;

  await Notification.create({ recipient: recipientId, type, title, body, link });

  try {
    await sendNotificationEmail(recipientEmail, title, title, body, link);
  } catch (err) {
    console.error(`notify(): failed to send email to ${recipientEmail} for type "${type}"`, err);
  }
}
