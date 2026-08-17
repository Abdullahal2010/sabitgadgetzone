import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import EmailOtp from './models/EmailOtp';
import { sendOtpEmail } from './mailer';

const CODE_LENGTH = 6;
const EXPIRY_MINUTES = 10;
// After this many wrong guesses against a live code, the code is dead even
// if the 10 minutes haven't elapsed yet — stops brute-forcing a 6-digit
// space (1,000,000 possibilities) within the expiry window.
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  // Zero-padded so it's always exactly CODE_LENGTH digits, including
  // leading zeros (e.g. "004821").
  const max = 10 ** CODE_LENGTH;
  const n = Math.floor(Math.random() * max);
  return String(n).padStart(CODE_LENGTH, '0');
}

/**
 * Generates a new 6-digit code for `email`, stores its hash (replacing any
 * previous in-flight code for that address), and emails it via Resend.
 * Rate limiting (see lib/otpRateLimit.ts) must be checked by the caller
 * BEFORE this runs.
 */
export async function issueEmailOtp(email: string): Promise<void> {
  await connectToDatabase();

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await EmailOtp.findOneAndUpdate(
    { email },
    { email, codeHash, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  // If sending fails, surface the error to the caller (who returns it to
  // the client) rather than leaving a code stored that was never actually
  // delivered.
  await sendOtpEmail(email, code, EXPIRY_MINUTES);
}

export interface VerifyEmailOtpResult {
  valid: boolean;
  reason?: string;
}

/**
 * Checks `code` against the stored (hashed) code for `email`. Consumes the
 * stored record on a correct guess (so the same code can't be reused) and
 * on running out of attempts (so a locked-out code can't keep being
 * retried after the fact) — but leaves it in place after an incorrect
 * guess that still has attempts remaining, so the user can try again.
 */
export async function verifyEmailOtp(email: string, code: string): Promise<VerifyEmailOtpResult> {
  await connectToDatabase();

  const doc = await EmailOtp.findOne({ email });
  if (!doc) {
    return { valid: false, reason: 'That code has expired — please request a new one.' };
  }

  if (doc.expiresAt.getTime() < Date.now()) {
    await EmailOtp.deleteOne({ _id: doc._id });
    return { valid: false, reason: 'That code has expired — please request a new one.' };
  }

  if (doc.attempts >= MAX_ATTEMPTS) {
    await EmailOtp.deleteOne({ _id: doc._id });
    return { valid: false, reason: 'Too many incorrect attempts — please request a new code.' };
  }

  const matches = await bcrypt.compare(code, doc.codeHash);
  if (!matches) {
    doc.attempts += 1;
    await doc.save();
    return { valid: false, reason: 'Incorrect code — please try again.' };
  }

  await EmailOtp.deleteOne({ _id: doc._id });
  return { valid: true };
}
