import nodemailer, { Transporter } from 'nodemailer';
import { getLogoBuffer, otpEmailHtml, OTP_EMAIL_SUBJECT, notificationEmailHtml } from './emailTemplate';

/**
 * Nodemailer (Gmail SMTP) sending backend — one of two interchangeable
 * backends behind lib/mailer.ts (the other is lib/resend.ts). Which one
 * actually runs is picked by EMAIL_PROVIDER in .env.local; this file only
 * gets called when EMAIL_PROVIDER=nodemailer.
 *
 * This is the "no domain needed yet" path: sends through a real personal
 * Gmail account via an App Password (not the account's normal login
 * password — see .env.local for how to generate one). Two things that are
 * different from the Resend path, both inherent to Gmail SMTP rather than
 * anything about this code:
 *
 *  - The From address is locked to GMAIL_USER itself — Gmail doesn't let a
 *    personal account send "as" a different address, only under its own
 *    with a custom display name (e.g. "Sabit Gadget's Zone <you@gmail.com>").
 *  - Deliverability/rate-limit behavior is Gmail's consumer-account rules,
 *    not a transactional-email service's — fine for testing and a small
 *    user base, but see the EMAIL_PROVIDER comment in .env.local for why
 *    this is meant to be swapped back to Resend once a domain exists.
 */
let cachedTransporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must both be set in .env.local.');
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  return cachedTransporter;
}

export async function sendOtpEmailViaNodemailer(to: string, code: string, expiryMinutes: number): Promise<void> {
  const transporter = getTransporter();
  const logo = await getLogoBuffer();
  const user = process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"Sabit Gadget's Zone" <${user}>`,
    to,
    subject: OTP_EMAIL_SUBJECT,
    html: otpEmailHtml(code, expiryMinutes),
    attachments: [
      {
        filename: 'logo.png',
        content: logo,
        cid: 'logo'
      }
    ]
  });
}

/** Generic account-notification email — see lib/notify.ts for callers. */
export async function sendNotificationEmailViaNodemailer(
  to: string,
  subject: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  const transporter = getTransporter();
  const logo = await getLogoBuffer();
  const user = process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"Sabit Gadget's Zone" <${user}>`,
    to,
    subject,
    html: notificationEmailHtml(title, body, link),
    attachments: [
      {
        filename: 'logo.png',
        content: logo,
        cid: 'logo'
      }
    ]
  });
}
