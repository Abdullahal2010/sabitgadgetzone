import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

/**
 * POST /api/users/onboarding
 *
 * Legacy: used to run once, right after a first-time phone number was
 * verified, back when registration only proved phone ownership and left
 * name/dob/address/email to be collected afterwards. Registration (see
 * app/api/auth/register/route.ts) now collects and verifies everything —
 * including a required, verified email — up front, so every session
 * produced by `authorize()` has `isNewUser: false` and middleware.ts never
 * routes anyone here anymore. Left in place only in case an old
 * pre-existing session (from before this change) still has
 * `isNewUser: true` cached in its JWT.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const phone = (session?.user as any)?.phone;

  if (!phone) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { name, dob, address, email } = await request.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await User.findOne({ phone });
  if (existing) {
    // Already onboarded — nothing to do, just tell the client so it can
    // refresh its session.
    return NextResponse.json(existing);
  }

  const user = await User.create({
    phone,
    name,
    dob: dob || undefined,
    address: address || undefined,
    email: email || undefined,
    walletBalance: 0
  });

  return NextResponse.json(user, { status: 201 });
}
