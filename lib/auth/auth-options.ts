import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authorizeAdminCredentials } from "@/lib/auth/admin-auth";
import { getSessionCookieOptions } from "@/lib/auth/cookie-options";
import { CustomUser } from "@/lib/types";

export const authOptions: NextAuthOptions = {
  pages: {
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "admin-password",
      name: "Administrator password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => authorizeAdminCredentials(credentials),
    }),
  ],
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: getSessionCookieOptions({
      vercelUrl: process.env.VERCEL_URL,
      nodeEnv: process.env.NODE_ENV,
    }),
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (!token.email) {
        return {};
      }
      if (user) {
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }) => {
      (session.user as CustomUser) = {
        id: token.sub,
        // @ts-ignore
        ...(token || session).user,
      };
      return session;
    },
  },
};
