import { sendOtpEmailViaResend } from './resend';
import { sendOtpEmailViaNodemailer } from './nodemailer';

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
