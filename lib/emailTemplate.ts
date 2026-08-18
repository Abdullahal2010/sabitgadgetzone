import { readFile } from 'fs/promises';
import path from 'path';

/**
 * The OTP email's HTML design, and the logo it embeds, shared by whichever
 * sending backend is active (see lib/mailer.ts). Both lib/resend.ts and
 * lib/nodemailer.ts import from here so the actual visual design only
 * exists in one place, regardless of which provider is sending it.
 */

const SITE_URL = process.env.NEXTAUTH_URL || 'https://sabitgadgetzone.com';

// Cached after first read so we don't hit disk on every send.
let cachedLogo: Buffer | null = null;
export async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogo) return cachedLogo;
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  cachedLogo = await readFile(logoPath);
  return cachedLogo;
}

export const OTP_EMAIL_SUBJECT = "Your Sabit Gadget's Zone verification code";

/**
 * Generic account-notification email — reused for every notification type
 * in lib/notify.ts (welcome, role change, ban/restriction, order updates,
 * etc.), so there's one visual template rather than one per notification
 * type. `title`/`body` are the same text stored on the Notification
 * document, so the email and the in-app popup entry always say the same
 * thing. `link`, if present, renders as a button linking back into the
 * site (e.g. straight to the relevant order).
 */
export function notificationEmailHtml(title: string, body: string, link?: string): string {
  const buttonHtml = link
    ? `<tr><td align="center" style="padding: 24px 32px 4px 32px;">
        <a href="${link}" style="display:inline-block; background-color:#0E8FC4; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:12px 28px; border-radius:999px;">View details</a>
      </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0; padding:0; background-color:#F3F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F7FA; padding: 32px 16px;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow: 0 6px 18px rgba(10,46,68,0.08);">

  <tr>
    <td align="center" style="background-color:#0A2E44; padding: 28px 24px 24px 24px;">
      <img src="cid:logo" width="56" height="56" alt="Sabit Gadget's Zone" style="display:block; border-radius:50%; background:#ffffff;" />
      <div style="color:#ffffff; font-size:16px; font-weight:800; margin-top:10px; letter-spacing:0.2px;">Sabit Gadget&rsquo;s Zone</div>
    </td>
  </tr>

  <tr>
    <td style="padding: 28px 32px 4px 32px;" align="center">
      <div style="font-size:19px; font-weight:800; color:#0A2E44; margin-bottom:8px;">${title}</div>
      <div style="font-size:14px; color:#465A68; line-height:1.6;">${body}</div>
    </td>
  </tr>

  ${buttonHtml}

  <tr>
    <td style="padding: 24px 32px 28px 32px;" align="center">
      <div style="font-size:12px; color:#8A9AA5;">You're receiving this because it relates to your Sabit Gadget's Zone account.</div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * The logo is referenced as `cid:logo` — every sending backend must attach
 * the buffer from getLogoBuffer() with content ID "logo" (Resend:
 * `contentId: 'logo'`, Nodemailer: `cid: 'logo'`) for it to render.
 */
export function otpEmailHtml(code: string, expiryMinutes: number): string {
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
