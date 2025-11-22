import { SupabaseAdapter } from "./supabase-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  adapter: SupabaseAdapter(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  ),
  pages: {
    signIn: "/auth",
    // Redirects here after the first successful sign-in
    newUser: "/onboarding",
  },
  session: {
    // Use JWT strategy so we don't hit the DB on every request via middleware
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Pass the user ID to the session so we can use it in queries
        // @ts-ignore - extending default session type
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // If an account is not linked, NextAuth throws OAuthAccountNotLinked
      // This happens when the email exists but is associated with another provider (or no provider)
      // Since we only have Google, this might happen if the user exists but without the Google account link.
      // We can try to link it manually or just return true to let the adapter handle it.
      return true;
    }
  },
};
