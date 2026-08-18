import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Auth guard for the whole site, unified around a single NextAuth session
 * (see lib/authOptions.ts) rather than the old separate admin cookie.
 *
 * Admin area — every /admin/* PAGE request is checked against a FRESH
 * database read, not the (potentially stale) JWT. Edge middleware can't
 * open a MongoDB connection itself, so this calls
 * GET /api/auth/session-permissions — an ordinary Node.js Route Handler —
 * forwarding the request's cookies, and acts on its answer. This is what
 * makes a promotion/demotion take effect on the very next navigation,
 * instead of waiting for the JWT to refresh (previously: re-login, or up
 * to the token's maxAge). app/admin/layout.tsx still does its own fresh
 * DB check too, as defense in depth, but this is what stops the request
 * before the admin bundle even renders.
 *
 * - Not signed in at all -> /login (with ?next= back to where they were headed)
 * - Signed in but not admin/moderator -> /profile (not /login — they don't
 *   need to log in again, they're just not staff)
 *
 * Staff WRITE api routes (POST/PUT/PATCH/DELETE on /api/products,
 * /api/users, /api/orders) keep the cheaper JWT-only pre-filter — the
 * route handlers themselves already re-check permissions against a fresh
 * DB read before actually mutating anything (see lib/serverAuth.ts), so a
 * stale JWT here can, at worst, let an already-fresh-checked-later request
 * through to the handler, never actually grant an unauthorized write.
 *
 * Shopper area — /profile, /checkout, /onboarding and /appeal require any
 * signed-in session. A verified-but-not-yet-onboarded session
 * (isNewUser: true) is redirected to /onboarding until it completes;
 * conversely, an already-onboarded user hitting /onboarding is sent to
 * /profile instead.
 *
 * Already signed in -> /login and /register redirect straight to /profile
 * (or /onboarding, for a session mid-onboarding) — there's no reason for
 * an authenticated user to see either page again.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminArea = pathname.startsWith('/admin');

  if (isAdminArea) {
    const permissionsUrl = new URL('/api/auth/session-permissions', request.url);
    const res = await fetch(permissionsUrl, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store'
    });
    const data = await res.json().catch(() => ({ authenticated: false, canAccessAdmin: false }));

    if (!data.authenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!data.canAccessAdmin) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    return NextResponse.next();
  }

  // POST /api/users/onboarding is the shopper's first-time profile
  // creation, and PATCH /api/users/me is a signed-in shopper editing their
  // OWN account — both stay public here, protected instead at the
  // route-handler level by the shopper's own NextAuth session (never by a
  // client-supplied id). Every other write to products/users/orders is an
  // admin/moderator-only action, permission-checked inside the route.
  const isOnboardingCreate = pathname === '/api/users/onboarding' && request.method === 'POST';
  const isSelfAccountWrite = pathname === '/api/users/me' && request.method === 'PATCH';
  const isStaffWriteApi =
    !isOnboardingCreate &&
    !isSelfAccountWrite &&
    pathname.startsWith('/api/') &&
    ['/api/products', '/api/users', '/api/orders'].some((p) => pathname.startsWith(p)) &&
    request.method !== 'GET';

  if (isStaffWriteApi) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = (token as any)?.role;
    const isStaff = role === 'admin' || role === 'moderator';

    if (!isStaff) {
      return NextResponse.json({ error: 'Unauthorized — admin or moderator login required' }, { status: 401 });
    }
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isNewUser = Boolean((token as any)?.isNewUser);

  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL(isNewUser ? '/onboarding' : '/profile', request.url));
  }

  const shopperProtectedPaths = ['/profile', '/checkout', '/onboarding', '/appeal'];
  if (shopperProtectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

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
    '/onboarding/:path*',
    '/appeal/:path*',
    '/login',
    '/register'
  ]
};
