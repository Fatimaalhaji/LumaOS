import { auth } from "@/auth";
import { deleteMemoryAction, upsertMemoryAction } from "@/server/actions";
import { listMemories } from "@/server/services/memory";
import { memoryTypes } from "@/lib/validation/core";

const typeDescriptions = {
  PROFILE: "Stable information about your profile/context.",
  PREFERENCE: "How you prefer things to be done.",
  GOAL: "A persistent objective you are working toward.",
  FACT: "A factual detail you explicitly provided.",
  KNOWLEDGE: "Information you want LumaOS to retain.",
  PROJECT: "Information associated with an ongoing project.",
} as const;

export default async function Memory({ searchParams }: { searchParams?: Promise<{ q?: string; type?: string }> }) {
  const session = await auth();
  const params = await searchParams;
  const selectedType = memoryTypes.find((type) => type === params?.type);
  const rows = await listMemories(session!.user.id, { query: params?.q ?? "", type: selectedType, limit: 50 });

  return <div className="grid gap-6">
    <div className="grid gap-2">
      <h1 className="text-4xl font-bold">Memory</h1>
      <p className="max-w-3xl text-slate-300">LumaOS uses these memories to personalize future assistance. You can edit or delete them at any time.</p>
    </div>

    <form className="card grid gap-3 md:grid-cols-[1fr_220px_auto]">
      <input name="q" defaultValue={params?.q ?? ""} placeholder="Search persistent memories" />
      <select name="type" defaultValue={selectedType ?? ""}>
        <option value="">All memory types</option>
        {memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <button>Search</button>
    </form>

    <form action={upsertMemoryAction} className="card grid gap-3 md:grid-cols-5">
      <select name="type" aria-label="Memory type">{memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
      <textarea name="content" placeholder="What should LumaOS remember?" required className="min-h-24 md:col-span-2" />
      <input name="importance" type="number" min="1" max="5" defaultValue="3" aria-label="Importance" />
      <input name="source" type="hidden" value="USER" />
      <button>Create memory</button>
    </form>

    <section className="grid gap-3">
      {rows.length ? rows.map((memory) => <article className="card grid gap-3" key={memory.id}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
          <span>{memory.type} · Importance {memory.importance}/5 · Source {memory.source}</span>
          <time dateTime={memory.createdAt.toISOString()}>Created {memory.createdAt.toLocaleDateString()}</time>
        </div>
        <p className="text-xs text-slate-500">{typeDescriptions[memory.type]}</p>
        <form action={upsertMemoryAction} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="id" value={memory.id} />
          <select name="type" defaultValue={memory.type}>{memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
          <textarea name="content" defaultValue={memory.content} required className="min-h-24 md:col-span-2" />
          <input name="importance" type="number" min="1" max="5" defaultValue={memory.importance} />
          <button>Save changes</button>
        </form>
        <form action={deleteMemoryAction.bind(null, memory.id)}>
          <button className="bg-rose-600 hover:bg-rose-500">Delete permanently</button>
        </form>
      </article>) : <div className="card text-slate-300"><h2 className="text-xl font-bold text-white">No memories yet</h2><p>Add a memory above to begin building your persistent personal context.</p></div>}
    </section>
  </div>;
}
