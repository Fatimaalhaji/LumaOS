import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/core";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authConfig = {
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens }),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({ credentials: { email: {}, password: {} }, async authorize(credentials) { const parsed = loginSchema.safeParse(credentials); if (!parsed.success) return null; const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1); if (!user?.passwordHash) return null; const ok = await bcrypt.compare(parsed.data.password, user.passwordHash); return ok ? { id: user.id, email: user.email, name: user.name } : null; } })],
  callbacks: { jwt({ token, user }) { if (user) token.sub = user.id; return token; }, session({ session, token }) { if (session.user && token.sub) session.user.id = token.sub; return session; } }
} satisfies NextAuthConfig;
