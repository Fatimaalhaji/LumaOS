import { auth } from "@/auth";
import { updateProfileAction } from "@/server/actions";
import { getProfile } from "@/server/repositories/core";

export default async function Settings() {
  const session = await auth();
  const profile = await getProfile(session!.user.id);
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div><p className="text-sm uppercase tracking-widest text-violet-300">Profile</p><h1 className="text-4xl font-bold">Personal settings</h1><p className="mt-2 text-slate-300">Control the profile context LumaOS may use. Changes are only saved when you submit this form.</p></div>
      <form action={updateProfileAction} className="card grid gap-4">
        <label className="grid gap-2"><span className="text-sm text-slate-300">Display name</span><input name="displayName" defaultValue={profile?.displayName ?? session!.user.name ?? ""} required maxLength={120} /></label>
        <label className="grid gap-2"><span className="text-sm text-slate-300">Primary goal</span><input name="primaryGoal" defaultValue={profile?.primaryGoal ?? ""} maxLength={180} placeholder="What are you focused on?" /></label>
        <label className="grid gap-2"><span className="text-sm text-slate-300">About / preferences</span><textarea name="about" defaultValue={profile?.about ?? ""} maxLength={1000} rows={5} placeholder="Short bio, learning style, or assistant preferences." /></label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><input name="onboardingCompleted" type="checkbox" defaultChecked={Boolean(profile?.onboardingCompletedAt)} value="true" /><span>Onboarding completed</span></label>
        <button className="w-fit">Save profile</button>
      </form>
    </div>
  );
}
