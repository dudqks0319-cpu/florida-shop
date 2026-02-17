import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { makeId, readDB, writeDB } from "@/lib/store";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  providers.push(
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
  );
}

if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  providers.push(
    Naver({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "dev-only-secret-change-me",
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.provider || !user?.email) return false;

      const provider = account.provider as "google" | "kakao" | "naver";
      if (!["google", "kakao", "naver"].includes(provider)) return false;

      const db = await readDB();
      const email = user.email.toLowerCase();
      const found = db.users.find((u) => (u.email || "").toLowerCase() === email && u.provider === provider);

      if (!found) {
        db.users.unshift({
          id: makeId(),
          name: user.name || email.split("@")[0],
          role: "requester",
          email,
          provider,
          createdAt: new Date().toISOString(),
        });
        await writeDB(db);
      }

      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const db = await readDB();
        const found = db.users.find((u) => (u.email || "").toLowerCase() === String(token.email).toLowerCase());
        if (found) {
          token.role = found.role;
          token.provider = found.provider;
          token.uid = found.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string; provider?: string }).id = String(token.uid || "");
        (session.user as { id?: string; role?: string; provider?: string }).role = String(token.role || "requester");
        (session.user as { id?: string; role?: string; provider?: string }).provider = String(token.provider || "");
      }
      return session;
    },
  },
});
