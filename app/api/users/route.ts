import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

// GET /api/users — admin only: "manage users" list.
//
// SECURITY: middleware.ts only guards non-GET requests to /api/users (so
// the admin-only POST/DELETE below stay protected), which left this GET
// reachable by anyone and leaking every user's phone/name/DOB/address/
// email. Checked explicitly here instead.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 });
  }
  await connectToDatabase();
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  return NextResponse.json(users);
}

// POST /api/users — admin only: add a user by hand from the dashboard.
// Real shoppers never hit this route — they're created automatically the
// first time they complete phone OTP + onboarding (see
// app/api/users/onboarding/route.ts). This exists purely for the admin
// "add user manually" convenience form.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const { phone, email, name, walletBalance } = await request.json();

  if (!phone || !name || !email) {
    return NextResponse.json({ error: 'phone, email and name are required' }, { status: 400 });
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ $or: [{ phone }, { email: normalizedEmail }] });
  if (existing) {
    return NextResponse.json(
      { error: 'A user with that phone number or email already exists' },
      { status: 409 }
    );
  }

  const user = await User.create({
    phone,
    email: normalizedEmail,
    name,
    walletBalance: walletBalance ?? 0
  });

  return NextResponse.json(user, { status: 201 });
}
