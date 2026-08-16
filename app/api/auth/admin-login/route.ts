import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/auth';
import { createAdminSessionToken } from '@/lib/adminSession';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

// POST /api/auth/admin-login
//
// Admin credentials live ONLY in .env.local (ADMIN_EMAIL / ADMIN_PASSWORD)
// — there is no hardcoded fallback, so a misconfigured deployment fails
// closed (login always rejected) instead of silently accepting a default
// password. On success, issues a signed, expiring session token (see
// lib/adminSession.ts) rather than a static "authenticated" string.
export async function POST(request: NextRequest) {
  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local.' },
      { status: 500 }
    );
  }

  const { email, password } = await request.json();

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  }

  const token = await createAdminSessionToken(validEmail, SESSION_MAX_AGE_SECONDS);

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  return response;
}

// DELETE /api/auth/admin-login — logs the admin out
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
