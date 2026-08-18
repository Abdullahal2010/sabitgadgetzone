/**
 * Single source of truth for "can this user do X". Used by API route
 * handlers (which re-check against a freshly-read User document, never
 * against the JWT alone, for anything that mutates data — see the
 * comments in each route) and by the UI (which can use the session's
 * cached role for show/hide decisions, since a stale menu item is low
 * stakes compared to a stale write).
 *
 * Admins bypass every check here — that's the "absolute access" the
 * product owner asked for, enforced in one place rather than sprinkled
 * as `role === 'admin' ||` throughout every check below.
 */

export type Role = 'user' | 'moderator' | 'admin';

export interface PermissionUser {
  role: Role;
  banned?: boolean;
  restrictions?: { canShop?: boolean; canReview?: boolean };
  moderatorPermissions?: {
    addProducts?: boolean;
    editProducts?: boolean;
    deleteProducts?: boolean;
    viewOrders?: boolean;
    changeOrderStatus?: boolean;
  };
}

/** Can manage users: view list, edit role/restrictions, ban, delete. Admin only. */
export function canManageUsers(u: PermissionUser): boolean {
  return u.role === 'admin';
}

/** Can add a product. */
export function canAddProduct(u: PermissionUser): boolean {
  if (u.role === 'admin') return true;
  if (u.role === 'moderator') return u.moderatorPermissions?.addProducts !== false;
  return false;
}

/** Can edit a product. */
export function canEditProduct(u: PermissionUser): boolean {
  if (u.role === 'admin') return true;
  if (u.role === 'moderator') return u.moderatorPermissions?.editProducts !== false;
  return false;
}

/** Can delete a product. */
export function canDeleteProduct(u: PermissionUser): boolean {
  if (u.role === 'admin') return true;
  if (u.role === 'moderator') return u.moderatorPermissions?.deleteProducts !== false;
  return false;
}

/** Can view the orders list/dashboard (moderator's filtered view, or admin's full view). */
export function canViewOrders(u: PermissionUser): boolean {
  if (u.role === 'admin') return true;
  if (u.role === 'moderator') return u.moderatorPermissions?.viewOrders !== false;
  return false;
}

/** Can change an order's status. */
export function canChangeOrderStatus(u: PermissionUser): boolean {
  if (u.role === 'admin') return true;
  if (u.role === 'moderator') return u.moderatorPermissions?.changeOrderStatus !== false;
  return false;
}

/** Can see dashboard-wide stats (revenue, total order/user counts). Admin only. */
export function canViewDashboardStats(u: PermissionUser): boolean {
  return u.role === 'admin';
}

/** Can this account check out / place an order. */
export function canShop(u: PermissionUser): boolean {
  if (u.role === 'admin' || u.role === 'moderator') return true;
  if (u.banned) return false;
  return u.restrictions?.canShop !== false;
}

/** Can this account submit a review. */
export function canReview(u: PermissionUser): boolean {
  if (u.role === 'admin' || u.role === 'moderator') return true;
  if (u.banned) return false;
  return u.restrictions?.canReview !== false;
}

/** Whether /admin/* pages are reachable at all. */
export function canAccessAdminArea(u: PermissionUser): boolean {
  return u.role === 'admin' || u.role === 'moderator';
}
