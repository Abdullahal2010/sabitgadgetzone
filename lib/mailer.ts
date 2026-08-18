import { sendOtpEmailViaResend, sendNotificationEmailViaResend } from './resend';
import { sendOtpEmailViaNodemailer, sendNotificationEmailViaNodemailer } from './nodemailer';

/**
 * The single entry point lib/emailOtp.ts calls to actually send an OTP
 * email. Which backend runs is controlled entirely by EMAIL_PROVIDER in
 * .env.local ("resend" or "nodemailer") — nothing else in the app needs to
 * change to switch providers, including when you move from Nodemailer
 * (now, no domain needed) back to Resend (once a domain is verified) —
 * see the EMAIL_PROVIDER comment in .env.local.
 */
export async function sendOtpEmail(to: string, code: string, expiryMinutes: number): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

  if (provider === 'nodemailer') {
    return sendOtpEmailViaNodemailer(to, code, expiryMinutes);
  }
  if (provider === 'resend') {
    return sendOtpEmailViaResend(to, code, expiryMinutes);
  }

  throw new Error(`Unknown EMAIL_PROVIDER "${provider}" — expected "resend" or "nodemailer".`);
}

/**
 * Entry point for account-notification emails (welcome, role change, ban,
 * order updates, ...) — see lib/notify.ts. Same provider switch as
 * sendOtpEmail above, kept as a separate function since the two email
 * kinds have different subjects/content, not because the routing logic
 * differs.
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

  if (provider === 'nodemailer') {
    return sendNotificationEmailViaNodemailer(to, subject, title, body, link);
  }
  if (provider === 'resend') {
    return sendNotificationEmailViaResend(to, subject, title, body, link);
  }

  throw new Error(`Unknown EMAIL_PROVIDER "${provider}" — expected "resend" or "nodemailer".`);
}
