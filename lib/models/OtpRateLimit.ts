import { Schema, models, model } from 'mongoose';

/**
 * One document per email address. Tracks OTP send requests so we can rate
 * limit at our own layer, independent of Resend's own abuse protection —
 * see lib/otpRateLimit.ts.
 *
 * This used to be keyed by phone (back when OTP verified phone ownership
 * via Firebase). Registration now verifies email ownership instead — see
 * app/api/auth/email-otp/request/route.ts — so this is keyed by email.
 */
const OtpRateLimitSchema = new Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  // Timestamps of recent OTP requests, newest last. Trimmed to the current
  // rate-limit window on every check so this never grows unbounded.
  requestTimestamps: { type: [Date], default: [] }
});

export default models.OtpRateLimit || model('OtpRateLimit', OtpRateLimitSchema);
