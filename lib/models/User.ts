import { Schema, models, model } from 'mongoose';

/**
 * A user has both a phone number and an email address, but only the EMAIL
 * is verified at signup — see app/api/auth/email-otp/request/route.ts and
 * the OTP check inside app/api/auth/register/route.ts. The phone number is
 * still collected and stored (E.164, e.g. +8801XXXXXXXXX) but is no longer
 * proven via SMS OTP; it's kept as a required contact/shipping field and,
 * along with email, as an alternative login identifier.
 *
 * Registration (see app/register/page.tsx + app/api/auth/register/route.ts)
 * collects name/phone/email/password/dob/gender up front, sends a 6-digit
 * code to that email (see lib/emailOtp.ts + lib/resend.ts), and only
 * creates the User document once that code is confirmed. Logging back in
 * afterwards accepts EITHER the phone or the email plus the password (see
 * lib/authOptions.ts) — no repeat OTP.
 *
 * passwordHash is a bcrypt hash, never the raw password. It's optional at
 * the schema level only because users created by hand from the admin
 * "add user" form (see app/api/users/route.ts POST) don't go through
 * registration and so have no password set.
 *
 * address is a legacy field from an earlier onboarding flow (app/onboarding)
 * that registration no longer collects; kept so existing data / that flow
 * still work.
 */
const UserSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String },
    dob: { type: String },
    gender: { type: String, enum: ['male', 'female'] },
    address: { type: String },
    walletBalance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default models.User || model('User', UserSchema);
