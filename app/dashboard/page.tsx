import Link from "next/link";
import { auth } from "@/auth";
import { getDashboard } from "@/server/repositories/core";
import { completeTaskAction } from "@/server/actions";

function trim(content: string) { return content.length > 140 ? `${content.slice(0, 139)}…` : content; }

export default async function Dashboard() {
  const session = await auth();
  const data = await getDashboard(session!.user.id);
  const totalOpen = data.tasks.length;
  return <div className="grid gap-6">
    <section className="grid gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-violet-500/20 to-slate-900 p-6">
      <p className="text-sm uppercase tracking-widest text-violet-200">Personal command center</p>
      <h1 className="text-4xl font-bold">Good day, {data.profile?.displayName ?? session!.user.name ?? "there"}.</h1>
      <p className="max-w-3xl text-slate-300">{data.profile?.primaryGoal ? `Current focus: ${data.profile.primaryGoal}` : "Complete your profile so LumaOS can personalize your workspace."}</p>
      <div className="flex flex-wrap gap-3"><Link className="rounded-xl bg-violet-600 px-4 py-2 font-semibold" href="/assistant">Ask LumaOS</Link><Link className="rounded-xl border border-slate-700 px-4 py-2" href="/settings">Edit profile</Link></div>
    </section>
    <section className="grid gap-4 md:grid-cols-4"><div className="card"><p className="text-slate-400">Active goals</p><strong className="text-3xl">{data.goals.length}</strong></div><div className="card"><p className="text-slate-400">Open tasks shown</p><strong className="text-3xl">{totalOpen}</strong></div><div className="card"><p className="text-slate-400">Memories</p><strong className="text-3xl">{data.memoryCount}</strong></div><div className="card"><p className="text-slate-400">Completed tasks</p><strong className="text-3xl">{data.completedTaskCount}</strong></div></section>
    <section className="grid gap-4 lg:grid-cols-2"><div className="card"><div className="flex justify-between gap-3"><h2 className="text-2xl font-bold">Goals</h2><Link href="/tasks">Manage</Link></div><div className="mt-4 grid gap-3">{data.goals.length ? data.goals.map(g => <div key={g.id} className="rounded-xl bg-slate-900 p-3"><p className="font-semibold">{g.title}</p>{g.description ? <p className="text-sm text-slate-400">{g.description}</p> : null}</div>) : <p className="text-slate-400">No active goals yet.</p>}</div></div><div className="card"><h2 className="text-2xl font-bold">Open tasks</h2><div className="mt-4 grid gap-3">{data.tasks.length ? data.tasks.map(t => <form action={completeTaskAction.bind(null, t.id)} key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-3"><span>{t.title}</span><button>Complete</button></form>) : <p className="text-slate-400">No open tasks yet.</p>}</div></div></section>
    <section className="grid gap-4 lg:grid-cols-2"><div className="card"><div className="flex justify-between"><h2 className="text-2xl font-bold">Important memories</h2><Link href="/memory">Review</Link></div><div className="mt-4 grid gap-3">{data.memories.length ? data.memories.map((m, i) => <div key={`${m.updatedAt}-${i}`} className="rounded-xl bg-slate-900 p-3"><p className="text-xs text-violet-300">{m.type} · {m.source} · importance {m.importance}</p><p className="text-sm text-slate-200">{trim(m.content)}</p></div>) : <p className="text-slate-400">No memories saved yet.</p>}</div></div><div className="card"><h2 className="text-2xl font-bold">Assistant activity</h2><p className="mt-2 text-slate-300">Using your profile, goals, tasks, relevant memories, and recent conversation context.</p><div className="mt-4 grid gap-2">{data.conversations.length ? data.conversations.map(c => <Link key={c.id} href="/assistant" className="rounded-xl bg-slate-900 p-3">{c.title}</Link>) : <p className="text-slate-400">Start your first conversation.</p>}</div></div></section>
  </div>;
}
