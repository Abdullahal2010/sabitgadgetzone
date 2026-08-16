// Split out from lib/auth.ts so middleware.ts (Edge runtime) can import the
// cookie name without pulling in next/headers, which is meant for Server
// Components / Route Handlers rather than middleware.
//
// Shopper sessions are now handled entirely by NextAuth (Auth.js), which
// manages its own cookie — see lib/authOptions.ts. This file only tracks
// the admin cookie, which still uses a small hand-rolled signed session
// (see lib/adminSession.ts) since the admin side is a single fixed
// credential pair from .env, not a per-user Auth.js identity.
export const ADMIN_COOKIE = 'admin_session';
