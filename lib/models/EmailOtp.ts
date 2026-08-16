import { Schema, models, model } from 'mongoose';

/**
 * One document per in-flight email verification. Created by
 * lib/emailOtp.ts when a code is sent (see
 * app/api/auth/email-otp/request/route.ts), consumed by lib/emailOtp.ts
 * when the code is checked (see app/api/auth/register/route.ts).
 *
 * The code itself is never stored in plaintext — only a bcrypt hash of it —
 * so a database read alone can't leak a usable code.
 *
 * `expiresAt` has a TTL index so Mongo automatically deletes the document
 * once it expires; we still check expiry explicitly in code rather than
 * relying on the TTL sweep's timing.
 *
 * `attempts` guards against brute-forcing a 6-digit code before it expires
 * — see MAX_ATTEMPTS in lib/emailOtp.ts.
 */
const EmailOtpSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.EmailOtp || model('EmailOtp', EmailOtpSchema);
