import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from './authConstants';
import { verifyAdminSessionToken } from './adminSession';

export { ADMIN_COOKIE };

/**
 * Verifies the signed, expiring admin session cookie (see
 * lib/adminSession.ts) — not just checking that some cookie is present.
 * For use in Server Components / Route Handlers only; middleware.ts does
 * its own equivalent check since next/headers isn't available on Edge.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const email = await verifyAdminSessionToken(token);
  return email !== null;
}
