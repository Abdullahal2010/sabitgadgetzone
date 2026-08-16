/**
 * Signed, expiring admin session tokens.
 *
 * Previously the admin cookie was just the literal string "authenticated" —
 * fine for a demo, but it means anything that could ever read/replay that
 * cookie value is "logged in" forever with no expiry. This signs the cookie
 * payload with HMAC-SHA256 (keyed by ADMIN_SESSION_SECRET) and embeds an
 * expiry, so a token can't be forged without the secret and can't be
 * replayed indefinitely.
 *
 * Uses Web Crypto (`crypto.subtle`) rather than Node's `crypto` module so
 * the exact same code works both in Route Handlers (Node runtime) and in
 * middleware.ts (Edge runtime).
 */

const ISSUER = 'sabit-admin';

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not set in .env.local');
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const str = atob(padded);
  return Uint8Array.from(str, (c) => c.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey('raw', encoder.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify'
  ]);
}

/** Creates a signed token: base64url(payload).base64url(signature) */
export async function createAdminSessionToken(email: string, maxAgeSeconds: number): Promise<string> {
  const payload = JSON.stringify({ iss: ISSUER, email, exp: Date.now() + maxAgeSeconds * 1000 });
  const encoder = new TextEncoder();
  const key = await hmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const sigB64 = toBase64Url(new Uint8Array(signature));
  return `${payloadB64}.${sigB64}`;
}

/** Verifies a token's signature and expiry. Returns the email if valid. */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  try {
    const [payloadB64, sigB64] = parts;
    const payloadBytes = fromBase64Url(payloadB64);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

    const key = await hmacKey();
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(sigB64), payloadBytes);

    if (!valid) return null;
    if (payload.iss !== ISSUER) return null;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;

    return payload.email as string;
  } catch {
    return null;
  }
}
