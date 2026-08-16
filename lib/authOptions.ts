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
        } | null>();

        // No account, or an admin-created account with no password set
        // yet — either way, this isn't a valid login.
        if (!existing || !existing.passwordHash) return null;

        const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: String(existing._id),
          phone: existing.phone,
          email: existing.email,
          name: existing.name,
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
        token.isNewUser = (user as any).isNewUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).phone = token.phone;
        (session.user as any).email = token.email;
        (session.user as any).isNewUser = token.isNewUser;
      }
      return session;
    }
  }
};
