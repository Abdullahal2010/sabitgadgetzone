import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyEmailOtp } from '@/lib/emailOtp';
import { notify } from '@/lib/notify';

const BD_E164_REGEX = /^\+8801[3-9]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 *
 * Runs once, right after the user has entered the 6-digit code sent to
 * their email (see app/register/page.tsx and
 * app/api/auth/email-otp/request/route.ts). The code is checked here,
 * server-side, against the hashed value stored by lib/emailOtp.ts — never
 * trusted just because the client says it matched — and the account is
 * only created if that check passes. This is the only place email
 * ownership is proven; the phone number is stored as typed (no SMS OTP).
 *
 * On success the account is fully set up (name, phone, email, password,
 * dob, gender all already collected) — the client then signs in with the
 * identifier-password provider using the same password the user just
 * typed, so they land straight on /profile with no repeat login step.
 */
export async function POST(request: Request) {
  const { name, phone, email, password, dob, gender, code } = await request.json();

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!phone || typeof phone !== 'string' || !BD_E164_REGEX.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid Bangladeshi mobile number.' }, { status: 400 });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }
  if (gender !== 'male' && gender !== 'female') {
    return NextResponse.json({ error: 'Please select a gender.' }, { status: 400 });
  }
  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const otpResult = await verifyEmailOtp(normalizedEmail, code);
  if (!otpResult.valid) {
    return NextResponse.json({ error: otpResult.reason }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await User.findOne({ $or: [{ phone }, { email: normalizedEmail }] }).lean();
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this phone number or email already exists.' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await User.create({
    phone,
    email: normalizedEmail,
    name: name.trim(),
    passwordHash,
    dob: dob || undefined,
    gender,
    walletBalance: 0
  });

  await notify({
    recipientId: String(created._id),
    recipientEmail: normalizedEmail,
    type: 'welcome',
    title: `Welcome to Sabit Gadget's Zone, ${name.trim()}!`,
    body: "Your account has been created. Explore the latest gadgets and enjoy shopping with us."
  });

  return NextResponse.json({ success: true, phone, email: normalizedEmail }, { status: 201 });
}
