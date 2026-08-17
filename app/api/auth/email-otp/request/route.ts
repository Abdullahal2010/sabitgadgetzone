import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { checkAndRecordOtpRequest } from '@/lib/otpRateLimit';
import { issueEmailOtp } from '@/lib/emailOtp';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_E164_REGEX = /^\+8801[3-9]\d{8}$/;

/**
 * POST /api/auth/email-otp/request
 *
 * The client calls this from the registration form (see
 * app/register/page.tsx) once name/phone/email/password/dob/gender have
 * all been filled in. Before sending anything, it checks that both the
 * email AND the phone number are unique — so a user re-using an existing
 * phone/email is told immediately, instead of being sent a code and only
 * finding out at final submit (see app/api/auth/register/route.ts, which
 * still re-checks uniqueness itself as the source of truth in case of a
 * race). Only after that check passes is a 6-digit code sent to the given
 * email via Resend (see lib/emailOtp.ts + lib/resend.ts). The code itself
 * is checked later, together with account creation, in
 * app/api/auth/register/route.ts.
 */
export async function POST(request: NextRequest) {
  const { email, phone } = await request.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!phone || typeof phone !== 'string' || !BD_E164_REGEX.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid Bangladeshi mobile number.' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  await connectToDatabase();

  const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] }).lean();
  if (existing) {
    const existingUser = existing as { email?: string; phone?: string };
    const emailTaken = existingUser.email === normalizedEmail;
    const phoneTaken = existingUser.phone === phone;
    const error =
      emailTaken && phoneTaken
        ? 'An account with this email and phone number already exists.'
        : emailTaken
        ? 'An account with this email already exists.'
        : 'An account with this phone number already exists.';
    return NextResponse.json({ error }, { status: 409 });
  }

  const rateLimit = await checkAndRecordOtpRequest(normalizedEmail);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.reason, retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429 }
    );
  }

  try {
    await issueEmailOtp(normalizedEmail);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not send the verification email — please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ sent: true });
}
