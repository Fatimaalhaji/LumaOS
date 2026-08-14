import { AppNav } from "@/components/layout/nav"; import { auth } from "@/auth"; import { redirect } from "next/navigation";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){ const s=await auth(); if(!s?.user) redirect('/login'); return <div className="flex"><AppNav/><main className="min-h-screen flex-1 p-8">{children}</main></div>; }
