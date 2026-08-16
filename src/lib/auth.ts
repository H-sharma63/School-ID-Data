import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1?.toLowerCase(),
  process.env.ADMIN_EMAIL_2?.toLowerCase(),
].filter(Boolean) as string[];

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(email);
      (user as any).role = isAdmin ? "ADMIN" : "TEACHER";
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  trustHost: true,

};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);