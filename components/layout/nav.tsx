import Link from "next/link";
import { logoutAction } from "@/server/actions";
const items = [["/dashboard","Home"],["/assistant","Assistant"],["/memory","Memory"],["/tasks","Tasks"],["/settings","Settings"]];
export function AppNav() { return <aside className="card min-h-screen w-64 rounded-none"><h1 className="mb-8 text-2xl font-bold">LumaOS</h1><nav className="grid gap-2">{items.map(([href,label]) => <Link className="rounded-xl px-3 py-2 hover:bg-slate-800" href={href} key={href}>{label}</Link>)}</nav><form action={logoutAction} className="mt-8"><button>Logout</button></form></aside>; }
