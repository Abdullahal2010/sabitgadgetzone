import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ADMIN_COOKIE } from './lib/authConstants';
import { verifyAdminSessionToken } from './lib/adminSession';

/**
 * Auth guard for both halves of the site.
 *
 * Admin area — every /admin/* page except /admin/login, plus admin-only
 * write APIs, require a valid *signed* admin_session cookie (see
 * lib/adminSession.ts) — not just its presence.
 *
 * Shopper area — /profile, /checkout and /onboarding require a valid
 * NextAuth session (email verified via a 6-digit code at registration,
 * login by phone or email + password — see lib/authOptions.ts). A
 * verified-but-not-yet-onboarded session (isNewUser: true) is redirected
 * to /onboarding until it completes; conversely, an already-onboarded user
 * hitting /onboarding is sent to /profile instead. In practice every
 * account created through /register is already fully onboarded, so this
 * only matters for sessions that predate this auth flow.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';

  // POST /api/users/onboarding is the *shopper's* first-time profile
  // creation, and PATCH/DELETE /api/users/me are a signed-in shopper
  // editing/deleting their OWN account — all three stay public here,
  // protected instead at the route-handler level by the shopper's own
  // NextAuth session (never by a client-supplied id, so one shopper can
  // never touch another's account this way). Every other write to
  // products/users/orders (add/edit/delete a product, add/remove/edit a
  // user from the dashboard, update an order's status) is an admin-only
  // action.
  //
  // Note: /api/checkout/* (create-payment, verify) and
  // /api/webhooks/deshipay aren't covered by this middleware's matcher at
  // all — they're outside the /api/products, /api/users, /api/orders
  // prefixes below by design, since checkout is a shopper action gated by
  // its own session check inside each route, and the webhook must stay
  // reachable by DeshiPay's servers with no session at all.
  const isOnboardingCreate = pathname === '/api/users/onboarding' && request.method === 'POST';
  const isSelfAccountWrite =
    pathname === '/api/users/me' && (request.method === 'PATCH' || request.method === 'DELETE');
  const isAdminWriteApi =
    !isOnboardingCreate &&
    !isSelfAccountWrite &&
    pathname.startsWith('/api/') &&
    ['/api/products', '/api/users', '/api/orders'].some((p) => pathname.startsWith(p)) &&
    request.method !== 'GET';

  if (isAdminArea || isAdminWriteApi) {
    const email = await verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!email) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const shopperProtectedPaths = ['/profile', '/checkout', '/onboarding'];
  if (shopperProtectedPaths.some((p) => pathname.startsWith(p))) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isNewUser = Boolean((token as any).isNewUser);

    if (isNewUser && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    if (!isNewUser && pathname === '/onboarding') {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/products/:path*',
    '/api/users/:path*',
    '/api/orders/:path*',
    '/profile/:path*',
    '/checkout/:path*',
    '/onboarding/:path*'
  ]
};
