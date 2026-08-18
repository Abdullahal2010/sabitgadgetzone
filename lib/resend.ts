import { Resend } from 'resend';
import { getLogoBuffer, otpEmailHtml, OTP_EMAIL_SUBJECT, notificationEmailHtml } from './emailTemplate';

/**
 * Resend sending backend — one of two interchangeable backends behind
 * lib/mailer.ts (the other is lib/nodemailer.ts). Which one actually runs
 * is picked by EMAIL_PROVIDER in .env.local; this file only gets called
 * when EMAIL_PROVIDER=resend.
 *
 * SENDING ADDRESS: until a domain is verified in the Resend dashboard,
 * Resend only allows sending FROM its shared sandbox address
 * (onboarding@resend.dev) and only allows delivery TO the email the
 * Resend account itself was signed up with. Once a real domain is
 * verified, set EMAIL_FROM (e.g. "Sabit Gadget's Zone <otp@yourdomain.com>")
 * in .env.local and every other line of this file stays the same.
 */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set. Add it to .env.local.');
  }
  return new Resend(apiKey);
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "Sabit Gadget's Zone <onboarding@resend.dev>";

export async function sendOtpEmailViaResend(to: string, code: string, expiryMinutes: number): Promise<void> {
  const resend = getResendClient();
  const logo = await getLogoBuffer();

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: OTP_EMAIL_SUBJECT,
    html: otpEmailHtml(code, expiryMinutes),
    attachments: [
      {
        filename: 'logo.png',
        content: logo,
        contentId: 'logo'
      }
    ]
  });

  if (error) {
    throw new Error(error.message || 'Failed to send verification email.');
  }
}

/** Generic account-notification email — see lib/notify.ts for callers. */
export async function sendNotificationEmailViaResend(
  to: string,
  subject: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  const resend = getResendClient();
  const logo = await getLogoBuffer();

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html: notificationEmailHtml(title, body, link),
    attachments: [
      {
        filename: 'logo.png',
        content: logo,
        contentId: 'logo'
      }
    ]
  });

  if (error) {
    throw new Error(error.message || 'Failed to send notification email.');
  }
}
