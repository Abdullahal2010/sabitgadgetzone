import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import User from './models/User';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login accepts EITHER the phone number or the email address, plus the
 * password — one identifier field, no separate "which one is this" toggle
 * (see app/login/page.tsx). Whichever the user typed, we look up the
 * account by that field and check the password the same way.
 *
 * OTP only ever happens once, at registration (see app/register/page.tsx +
 * app/api/auth/register/route.ts + lib/emailOtp.ts), to prove EMAIL
 * ownership before the account (with its password) is created. Signing
 * back in afterwards never repeats that step, regardless of which
 * identifier is used.
 *
 * The returned/session `phone` field is kept as-is (rather than renamed)
 * so every downstream route that already reads `session.user.phone` —
 * orders, reviews, checkout, the profile API, etc. — keeps working
 * unchanged; it's just no longer the ONLY way to look the account up at
 * login time.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  // Deliberately NOT derived from NEXTAUTH_URL — that env var is easy to
  // leave misconfigured (e.g. still pointing at localhost from local dev)
  // across Vercel's Production/Preview environments, and next-auth's
  // secure-cookie name depends on it. Pinning this to NODE_ENV keeps the
  // cookie name/flags deterministic and, critically, keeps it IN SYNC with
  // the `secureCookie` passed to getToken() in middleware.ts — a mismatch
  // there is what causes "logged in, but every navigation bounces to
  // /login until a hard reload".
  useSecureCookies: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialsProvider({
      id: 'identifier-password',
      name: 'Phone/Email + Password',
      credentials: {
        identifier: { label: 'Phone or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        await connectToDatabase();

        const query = EMAIL_REGEX.test(identifier)
          ? { email: identifier.toLowerCase() }
          : { phone: identifier };

        const existing = await User.findOne(query).lean<{
          _id: string;
          phone: string;
          email: string;
          name: string;
          passwordHash?: string;
          role?: 'user' | 'moderator' | 'admin';
          banned?: boolean;
          moderatorPermissions?: Record<string, boolean>;
        } | null>();

        // No account, or an admin-created account with no password set
        // yet — either way, this isn't a valid login.
        if (!existing || !existing.passwordHash) return null;

        const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
        if (!passwordMatches) return null;

        // Banned users can still log in and browse (per product spec —
        // only checkout/review are blocked, checked at those specific
        // routes against the DB, not here).
        return {
          id: String(existing._id),
          phone: existing.phone,
          email: existing.email,
          name: existing.name,
          role: existing.role || 'user',
          moderatorPermissions: existing.moderatorPermissions,
          isNewUser: false
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.phone = (user as any).phone;
        token.email = (user as any).email;
        token.role = (user as any).role || 'user';
        // Only meaningful for moderators, carried on the JWT purely so the
        // admin sidebar (client component) can decide which links to show
        // without an extra request — the API routes never trust this for
        // an actual permission decision, they re-read it from the DB (see
        // lib/serverAuth.ts).
        token.moderatorPermissions = (user as any).moderatorPermissions;
        token.isNewUser = (user as any).isNewUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).phone = token.phone;
        (session.user as any).email = token.email;
        (session.user as any).role = token.role || 'user';
        (session.user as any).moderatorPermissions = token.moderatorPermissions;
        (session.user as any).isNewUser = token.isNewUser;
      }
      return session;
    },
    // Default next-auth behavior turns a relative callbackUrl (e.g. the "/"
    // passed by signOut() in contexts/UserContext.tsx) into an ABSOLUTE url
    // by prefixing it with `baseUrl`, and baseUrl comes straight from
    // NEXTAUTH_URL. If that env var is stale/wrong for this environment
    // (the classic case: still "http://localhost:3000" from local dev,
    // left untouched in Vercel's dashboard), every sign-out sends the
    // browser to localhost instead of the real domain. Returning the
    // relative path as-is sidesteps that: the browser resolves it against
    // whatever origin it's actually on, which is always correct.
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return url;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // fall through
      }
      return baseUrl;
    }
  }
};
