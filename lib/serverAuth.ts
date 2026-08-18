import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { connectToDatabase } from './mongodb';
import User from './models/User';
import { PermissionUser } from './permissions';

export interface SessionUser extends PermissionUser {
  id: string;
  phone: string;
  email: string;
  name: string;
}

/**
 * Resolves the signed-in NextAuth session AND does a fresh read of that
 * user's role/ban/restriction/permission fields straight from MongoDB —
 * never trusting the JWT's cached `role` for anything that's about to
 * mutate data (see lib/permissions.ts's doc comment, and the
 * role-based-access planning discussion: the JWT is fine for UI, the DB is
 * the source of truth for writes).
 *
 * Returns null if there's no session or the account no longer exists.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const phone = (session?.user as any)?.phone;
  if (!phone) return null;

  await connectToDatabase();
  const user = await User.findOne({ phone }).lean<{
    _id: string;
    phone: string;
    email: string;
    name: string;
    role?: 'user' | 'moderator' | 'admin';
    banned?: boolean;
    restrictions?: { canShop?: boolean; canReview?: boolean };
    moderatorPermissions?: {
      addProducts?: boolean;
      editProducts?: boolean;
      deleteProducts?: boolean;
      viewOrders?: boolean;
      changeOrderStatus?: boolean;
    };
  } | null>();

  if (!user) return null;

  return {
    id: String(user._id),
    phone: user.phone,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    banned: user.banned,
    restrictions: user.restrictions,
    moderatorPermissions: user.moderatorPermissions
  };
}
