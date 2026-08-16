import { NextRequest, NextResponse } from 'next/server';
import { checkAndRecordOtpRequest } from '@/lib/otpRateLimit';

const BD_PHONE_REGEX = /^\+8801[3-9]\d{8}$/;

/**
 * POST /api/auth/otp/request
 *
 * The client calls this BEFORE triggering Firebase's signInWithPhoneNumber.
 * It's our own per-phone-number rate limit, independent of Firebase, so one
 * number can't be used to trigger unlimited SMS sends. Firebase never sees
 * this request — this is purely a gate + bookkeeping step.
 */
export async function POST(request: NextRequest) {
  const { phone } = await request.json();

  if (!phone || typeof phone !== 'string' || !BD_PHONE_REGEX.test(phone)) {
    return NextResponse.json(
      { error: 'Enter a valid Bangladeshi phone number, e.g. +8801XXXXXXXXX' },
      { status: 400 }
    );
  }

  const result = await checkAndRecordOtpRequest(phone);

  if (!result.allowed) {
    return NextResponse.json(
      { error: result.reason, retryAfterSeconds: result.retryAfterSeconds },
      { status: 429 }
    );
  }

  return NextResponse.json({ allowed: true });
}
