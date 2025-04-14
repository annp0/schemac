import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import GitHub from "next-auth/providers/github"
import Credentials from 'next-auth/providers/credentials';
import { createUser, getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return users[0] as any;
      },
    }),
    GitHub,
  ],
  callbacks: {

    async signIn({ user, account }) {
      // For credentials provider, continue with existing logic
      if (account?.provider === 'credentials') {
        return true;
      }

      // For GitHub authentication
      if (account?.provider === 'github') {
        try {
          // Check if user with this email already exists in your DB
          if (user.email) {
            const [existingUser] = await getUser(user.email);

            if (existingUser) {
              user.id = existingUser.id;
            }

            if (!existingUser) {
              // Create new user in your database using GitHub data
              // No password needed for OAuth-created accounts
              await createUser(user.email, Math.random().toString(36).slice(-8));
              const [newUser] = await getUser(user.email);
              user.id = newUser.id;
            }
          }
          return true;
        } catch (error) {
          console.error('GitHub auth error:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
