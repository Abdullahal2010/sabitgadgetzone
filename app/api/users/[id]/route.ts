import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUser } from '@/lib/serverAuth';
import { canManageUsers } from '@/lib/permissions';
import { notify } from '@/lib/notify';

// DELETE /api/users/:id — admin only: remove a user from the dashboard.
// This is the ONLY place a user account can be deleted — a shopper can no
// longer delete their own account from /profile (see app/api/users/me,
// which no longer exposes DELETE at all).
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canManageUsers(sessionUser)) {
    return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

const MOD_PERMISSION_KEYS = ['addProducts', 'editProducts', 'deleteProducts', 'viewOrders', 'changeOrderStatus'] as const;
const RESTRICTION_KEYS = ['canShop', 'canReview'] as const;

/** True if any key present in `after` is `false` while it was `true` (or unset/true-by-default) in `before`. */
function anyRemoved(before: Record<string, boolean> | undefined, after: Record<string, boolean>, keys: readonly string[]) {
  return keys.some((k) => after[k] === false && before?.[k] !== false);
}
/** True if any key present in `after` is `true` while it was explicitly `false` in `before`. */
function anyAdded(before: Record<string, boolean> | undefined, after: Record<string, boolean>, keys: readonly string[]) {
  return keys.some((k) => after[k] === true && before?.[k] === false);
}

// PATCH /api/users/:id — admin only. Handles every "manage user" action in
// one route: promote/demote role, toggle a moderator's per-action
// permissions, ban/unban, and toggle a regular user's shop/review
// restrictions.
//
// IMPORTANT: only fields that ACTUALLY CHANGE trigger a notification —
// the admin UI (ManageUserModal) always sends the full current state of
// every field on every save (it doesn't track a diff client-side), so
// naively notifying on "field is present in the request body" fired a
// second, spurious notification (e.g. "unbanned") on every single save,
// including plain role promotions. Comparing against the value actually
// stored before this update fixes that.
//
// A role change is treated as the headline event: if role changed, that's
// the ONE notification sent for this request, even if moderatorPermissions
// or restrictions were also included in the same payload (promoting
// someone always ships their default permission set alongside the role,
// which isn't a separate change worth telling them about).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canManageUsers(sessionUser)) {
    return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { role, moderatorPermissions, banned, banReason, restrictions } = body as {
    role?: 'user' | 'moderator' | 'admin';
    moderatorPermissions?: Record<string, boolean>;
    banned?: boolean;
    banReason?: string;
    restrictions?: { canShop?: boolean; canReview?: boolean };
  };

  await connectToDatabase();
  const target = await User.findById(params.id);
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (String(target._id) === sessionUser.id) {
    return NextResponse.json({ error: "You can't modify your own account here" }, { status: 400 });
  }
  // Admins are never subject to these controls — no self-restriction
  // footguns, and no admin can be restricted by another admin this way.
  if (target.role === 'admin') {
    return NextResponse.json({ error: "Admin accounts can't be restricted or demoted" }, { status: 400 });
  }

  // Snapshot "before" state for diffing, taken BEFORE any mutation below.
  const previousRole = target.role;
  const previousBanned = Boolean(target.banned);
  const previousModPerms = target.moderatorPermissions ? { ...target.moderatorPermissions } : undefined;
  const previousRestrictions = target.restrictions ? { ...target.restrictions } : undefined;

  if (role !== undefined) target.role = role;
  if (moderatorPermissions !== undefined) {
    target.moderatorPermissions = { ...target.moderatorPermissions, ...moderatorPermissions };
  }
  if (banned !== undefined) {
    target.banned = banned;
    target.banReason = banned ? banReason || '' : undefined;
  }
  if (restrictions !== undefined) {
    target.restrictions = { ...target.restrictions, ...restrictions };
  }

  await target.save();

  const roleChanged = role !== undefined && role !== previousRole;

  if (roleChanged) {
    // The one notification for this save — see the function doc comment.
    let title = 'Your account role has changed';
    let notifBody = `Your account is now set to "${role}".`;
    let link: string | undefined;

    if (role === 'admin') {
      notifBody = "You've been made an admin. You now have full access to the dashboard.";
      link = '/admin/dashboard';
    } else if (role === 'moderator') {
      notifBody = "You've been promoted to Moderator. You now have access to the admin panel.";
      link = '/admin/products';
    } else if (role === 'user') {
      notifBody = 'Your admin/moderator access has been removed.';
      link = undefined;
    }

    await notify({
      recipientId: String(target._id),
      recipientEmail: target.email,
      type: 'role_change',
      title,
      body: notifBody,
      link
    });
  } else {
    // Role is unchanged this save — evaluate the other fields
    // independently, but only notify for whichever ones actually changed.
    const bannedChanged = banned !== undefined && banned !== previousBanned;

    if (bannedChanged) {
      await notify({
        recipientId: String(target._id),
        recipientEmail: target.email,
        type: banned ? 'banned' : 'unbanned',
        title: banned ? 'Account banned' : 'Account reinstated',
        body: banned ? 'Your account is banned.' : 'Your account is no longer banned.',
        link: banned ? '/appeal' : '/profile?tab=status'
      });
    } else if (target.role === 'moderator' && moderatorPermissions !== undefined) {
      const after = target.moderatorPermissions as unknown as Record<string, boolean>;
      const removed = anyRemoved(previousModPerms, after, MOD_PERMISSION_KEYS);
      const added = anyAdded(previousModPerms, after, MOD_PERMISSION_KEYS);
      if (removed) {
        await notify({
          recipientId: String(target._id),
          recipientEmail: target.email,
          type: 'restriction_change',
          title: 'Access updated',
          body: 'This permission is removed from your account.',
          link: '/admin/products'
        });
      } else if (added) {
        await notify({
          recipientId: String(target._id),
          recipientEmail: target.email,
          type: 'restriction_change',
          title: 'Access updated',
          body: 'A new permission has been added to your account.',
          link: '/admin/products'
        });
      }
    } else if (target.role === 'user' && restrictions !== undefined) {
      const after = target.restrictions as unknown as Record<string, boolean>;
      const removed = anyRemoved(previousRestrictions, after, RESTRICTION_KEYS);
      const added = anyAdded(previousRestrictions, after, RESTRICTION_KEYS);
      if (removed) {
        await notify({
          recipientId: String(target._id),
          recipientEmail: target.email,
          type: 'restriction_change',
          title: 'Access updated',
          body: 'This permission is removed from your account.',
          link: '/profile?tab=status'
        });
      } else if (added) {
        await notify({
          recipientId: String(target._id),
          recipientEmail: target.email,
          type: 'restriction_change',
          title: 'Access updated',
          body: 'Your account access has been restored.',
          link: '/profile?tab=status'
        });
      }
    }
  }

  const updated = await User.findById(params.id).select('-passwordHash').lean();
  return NextResponse.json(updated);
}
