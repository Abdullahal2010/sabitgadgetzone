import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

// GET /api/users/me — the signed-in shopper's own profile, resolved from
// their session (never from a client-supplied phone number/id), so one
// shopper can never fetch another shopper's profile this way.
export async function GET() {
  const session = await getServerSession(authOptions);
  const phone = (session?.user as any)?.phone;

  if (!phone) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findOne({ phone }).select('-passwordHash').lean();
  if (!user) {
    return NextResponse.json({ error: 'Not onboarded yet' }, { status: 404 });
  }
  return NextResponse.json(user);
}

// PATCH /api/users/me — the signed-in shopper editing their OWN profile.
// Neither phone NOR email is editable here: both are now valid, unique
// login identities (see lib/authOptions.ts) — email verified at signup via
// OTP, phone unverified but still unique — and changing either would need
// its own re-verification/uniqueness flow, plus a session refresh (the
// NextAuth JWT caches whichever identifier was used to sign in), which is
// out of scope for a simple profile edit. Everything else — address,
// dob, gender, name — can be set or updated here.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const phone = (session?.user as any)?.phone;

  if (!phone) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, address, dob, gender } = body as {
    name?: unknown;
    address?: unknown;
    dob?: unknown;
    gender?: unknown;
  };

  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};

  if (name !== undefined) {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    set.name = trimmed;
  }

  if (address !== undefined) {
    const trimmed = typeof address === 'string' ? address.trim() : '';
    if (trimmed) {
      if (trimmed.length > 300) {
        return NextResponse.json({ error: 'Address is too long' }, { status: 400 });
      }
      set.address = trimmed;
    } else {
      unset.address = '';
    }
  }

  if (dob !== undefined) {
    const trimmed = typeof dob === 'string' ? dob.trim() : '';
    if (trimmed) {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
        return NextResponse.json({ error: 'Enter a valid date of birth' }, { status: 400 });
      }
      set.dob = trimmed;
    } else {
      unset.dob = '';
    }
  }

  if (gender !== undefined) {
    if (gender === 'male' || gender === 'female') {
      set.gender = gender;
    } else if (gender === '' || gender === null) {
      unset.gender = '';
    } else {
      return NextResponse.json({ error: 'Gender must be male or female' }, { status: 400 });
    }
  }

  await connectToDatabase();

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;

  if (!Object.keys(update).length) {
    const unchanged = await User.findOne({ phone }).select('-passwordHash').lean();
    return NextResponse.json(unchanged);
  }

  const updated = await User.findOneAndUpdate({ phone }, update, { new: true }).select('-passwordHash').lean();
  if (!updated) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// Account deletion is admin-only now (see DELETE /api/users/[id]) — a
// shopper can no longer delete their own account from /profile. There is
// intentionally no DELETE handler here.
