import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Thin wrapper around Resend, used only to send the 6-digit email
 * verification code during registration — see lib/emailOtp.ts and
 * app/api/auth/email-otp/request/route.ts.
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
const SITE_URL = process.env.NEXTAUTH_URL || 'https://sabitgadgetzone.com';

// Cached after first read so we don't hit disk on every send.
let cachedLogo: Buffer | null = null;
async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogo) return cachedLogo;
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  cachedLogo = await readFile(logoPath);
  return cachedLogo;
}

function otpEmailHtml(code: string, expiryMinutes: number): string {
  const digits = code.split('');
  const boxes = digits
    .map(
      (d) => `
        <td style="width:44px; height:52px; background-color:#EAF6FC; border:2px solid #0E8FC4; border-radius:8px; text-align:center; vertical-align:middle; font-size:22px; font-weight:800; color:#0A2E44; font-family: -apple-system, Helvetica, Arial, sans-serif;">${d}</td>
        <td style="width:10px;"></td>`
    )
    .join('')
    .replace(/<td style="width:10px;"><\/td>$/, ''); // no trailing gap

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Verify your email</title></head>
<body style="margin:0; padding:0; background-color:#F3F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F7FA; padding: 32px 16px;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow: 0 6px 18px rgba(10,46,68,0.08);">

  <tr>
    <td align="center" style="background-color:#0A2E44; padding: 28px 24px 24px 24px;">
      <img src="cid:logo" width="64" height="64" alt="Sabit Gadget's Zone" style="display:block; border-radius:50%; background:#ffffff;" />
      <div style="color:#ffffff; font-size:18px; font-weight:800; margin-top:12px; letter-spacing:0.2px;">Sabit Gadget&rsquo;s Zone</div>
    </td>
  </tr>

  <tr>
    <td style="padding: 32px 32px 8px 32px;" align="center">
      <div style="font-size:20px; font-weight:800; color:#0A2E44; margin-bottom:8px;">Verify your email</div>
      <div style="font-size:14px; color:#8A9AA5; line-height:1.6; max-width:360px;">
        Enter the code below to finish creating your account. This code expires in <strong style="color:#0A2E44;">${expiryMinutes} minutes</strong>.
      </div>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 24px 32px 8px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>${boxes}</tr></table>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 8px 32px 28px 32px;">
      <div style="font-size:12px; color:#8A9AA5;">
        Having trouble? Your code is <strong style="color:#0E8FC4; letter-spacing:2px;">${code}</strong>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding: 0 32px 32px 32px;">
      <div style="border-top:1px solid #E3EDF2; padding-top:20px; font-size:12px; color:#8A9AA5; text-align:center; line-height:1.6;">
        Didn&rsquo;t request this code? You can safely ignore this email — no account will be created.
      </div>
    </td>
  </tr>

  <tr>
    <td style="background-color:#0A2E44; padding: 24px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding-bottom:14px;">
            <a href="${SITE_URL}/" style="color:#ffffff; font-size:12px; text-decoration:none; margin:0 10px;">Shop</a>
            <a href="${SITE_URL}/profile" style="color:#ffffff; font-size:12px; text-decoration:none; margin:0 10px;">My Account</a>
            <a href="${SITE_URL}/wishlist" style="color:#ffffff; font-size:12px; text-decoration:none; margin:0 10px;">Wishlist</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="color:#ffffff; opacity:0.6; font-size:11px; padding-bottom:4px;">
            support@sabitgadgets.com &nbsp;&bull;&nbsp; Dhaka, Bangladesh
          </td>
        </tr>
        <tr>
          <td align="center" style="color:#ffffff; opacity:0.45; font-size:11px;">
            &copy; ${new Date().getFullYear()} Sabit Gadget&rsquo;s Zone. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Sends the 6-digit verification code to `to`, with the store's logo
 * embedded inline (via a cid attachment, not a hosted URL or base64 data
 * URI — the most reliable way to get a logo to render across Gmail/Outlook/
 * etc, see lib/resend.ts header comment).
 */
export async function sendOtpEmail(to: string, code: string, expiryMinutes: number): Promise<void> {
  const resend = getResendClient();
  const logo = await getLogoBuffer();

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Your Sabit Gadget's Zone verification code",
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
