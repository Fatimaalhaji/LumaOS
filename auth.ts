import NextAuth, { getServerSession } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { authConfig } from "@/lib/auth/config";

export const auth = () => getServerSession(authConfig);
export { signIn, signOut };
export const authHandler = NextAuth(authConfig);
