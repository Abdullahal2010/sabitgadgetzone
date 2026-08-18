import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/serverAuth';
import { canAccessAdminArea } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session-permissions
 *
 * Middleware runs on the Edge runtime, which can't open a MongoDB
 * connection directly — that's why the original /admin/* gate could only
 * trust the NextAuth JWT's cached `role`, and a role change didn't take
 * effect until that JWT refreshed (re-login or expiry). This route is the
 * fix: it's an ordinary Node.js Route Handler, so it CAN read the DB, and
 * middleware calls it (forwarding the request's cookies) on every /admin/*
 * navigation to get a truly fresh answer. See middleware.ts.
 */
export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ authenticated: false, canAccessAdmin: false });
  }

  return NextResponse.json({
    authenticated: true,
    role: sessionUser.role,
    canAccessAdmin: canAccessAdminArea(sessionUser)
  });
}
