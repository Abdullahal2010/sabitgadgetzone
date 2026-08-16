import { connectToDatabase } from './mongodb';
import OtpRateLimit from './models/OtpRateLimit';

const MAX_PER_WINDOW = Number(process.env.OTP_MAX_PER_WINDOW || 5);
const WINDOW_MINUTES = Number(process.env.OTP_WINDOW_MINUTES || 60);
const MIN_SECONDS_BETWEEN = Number(process.env.OTP_MIN_SECONDS_BETWEEN_REQUESTS || 60);

export interface OtpRateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: string;
}

/**
 * Server-side rate limit for the "send OTP email" step, keyed by email
 * address. This is separate from (and in addition to) whatever abuse
 * protection Resend itself applies — it's our own explicit guard so one
 * email address can't be used to trigger unlimited sends.
 *
 * Call this BEFORE actually sending the email via Resend. On success,
 * records the attempt.
 */
export async function checkAndRecordOtpRequest(email: string): Promise<OtpRateLimitResult> {
  await connectToDatabase();

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

  let doc = await OtpRateLimit.findOne({ email });
  if (!doc) {
    doc = await OtpRateLimit.create({ email, requestTimestamps: [] });
  }

  // Keep only timestamps still inside the current window.
  const recent = doc.requestTimestamps.filter((t: Date) => t > windowStart);

  if (recent.length > 0) {
    const last = recent[recent.length - 1];
    const secondsSinceLast = (now.getTime() - new Date(last).getTime()) / 1000;
    if (secondsSinceLast < MIN_SECONDS_BETWEEN) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(MIN_SECONDS_BETWEEN - secondsSinceLast),
        reason: 'Please wait a moment before requesting another code.'
      };
    }
  }

  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.ceil(
      (new Date(oldest).getTime() + WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 1000
    );
    return {
      allowed: false,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
      reason: `Too many code requests for this email. Try again in a while.`
    };
  }

  recent.push(now);
  doc.requestTimestamps = recent;
  await doc.save();

  return { allowed: true };
}
