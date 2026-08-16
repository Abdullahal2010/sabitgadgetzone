import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { checkAndRecordOtpRequest } from '@/lib/otpRateLimit';
import { issueEmailOtp } from '@/lib/emailOtp';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/email-otp/request
 *
 * The client calls this from the registration form (see
 * app/register/page.tsx) once name/phone/email/password/dob/gender have
 * all been filled in. Sends a 6-digit code to the given email via Resend
 * (see lib/emailOtp.ts + lib/resend.ts). The code itself is checked later,
 * together with account creation, in app/api/auth/register/route.ts.
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  await connectToDatabase();

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    );
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
