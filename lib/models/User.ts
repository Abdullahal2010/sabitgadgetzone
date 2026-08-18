import { Schema, models, model } from 'mongoose';

/**
 * A user has both a phone number and an email address, but only the EMAIL
 * is verified at signup — see app/api/auth/email-otp/request/route.ts and
 * the OTP check inside app/api/auth/register/route.ts. The phone number is
 * still collected and stored (E.164, e.g. +8801XXXXXXXXX) but is no longer
 * proven via SMS OTP; it's kept as a required contact/shipping field and,
 * along with email, as an alternative login identifier.
 *
 * passwordHash is a bcrypt hash, never the raw password. It's optional at
 * the schema level only because users created by hand from the admin
 * "add user" form (see app/api/users/route.ts POST) don't go through
 * registration and so have no password set.
 *
 * address is a legacy field from an earlier onboarding flow (app/onboarding)
 * that registration no longer collects; kept so existing data / that flow
 * still work.
 *
 * --- Role-based access ---
 *
 * role: every account is 'user' by default. The very first admin is
 * promoted by hand directly in the database; every admin/moderator after
 * that is promoted from the admin "manage users" screen. Admins have
 * unrestricted access everywhere — none of the fields below ever apply to
 * an admin account, by convention enforced in lib/permissions.ts, not by a
 * schema constraint.
 *
 * banned: a hard restriction — blocks checkout and review submission
 * everywhere (browsing/products/cart/wishlist stay open). Distinct from
 * `restrictions` below, which lets an admin restrict a *specific* action
 * without a full ban.
 *
 * restrictions: fine-grained toggles for ordinary users, independent of a
 * full ban — e.g. an admin can leave browsing/reviewing open while
 * blocking checkout specifically.
 *
 * moderatorPermissions: only meaningful when role === 'moderator'. Set to
 * all-true the moment someone is promoted; an admin can flip any subset
 * off, per moderator, at promotion time or later. These flags
 * *intentionally* persist even if the moderator is demoted back to 'user'
 * and later re-promoted, so an admin's earlier restriction choices aren't
 * silently lost.
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
    walletBalance: { type: Number, default: 0 },

    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user', index: true },

    banned: { type: Boolean, default: false },
    banReason: { type: String },

    restrictions: {
      canShop: { type: Boolean, default: true },
      canReview: { type: Boolean, default: true }
    },

    moderatorPermissions: {
      addProducts: { type: Boolean, default: true },
      editProducts: { type: Boolean, default: true },
      deleteProducts: { type: Boolean, default: true },
      viewOrders: { type: Boolean, default: true },
      changeOrderStatus: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export default models.User || model('User', UserSchema);
