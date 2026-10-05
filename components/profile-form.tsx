"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Profile = { first_name: string | null; last_name: string | null; avatar_path: string | null };


export function ProfileForm({ userId, email, profile }: {
  userId: string; email: string; profile: Profile | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaved(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const first = String(data.get("first_name") ?? "").trim();
    const last = String(data.get("last_name") ?? "").trim();
    if (!first || !last || first.length > 80 || last.length > 80) {
      setError("Please enter a first and last name, up to 80 characters each."); return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== userId) throw new Error("Your session expired. Please sign in again.");
      const { error } = await supabase.from("profiles").upsert({ id: user.id, first_name: first, last_name: last });
      if (error) throw new Error("Your profile could not be saved. Please try again.");
      setSaved(true); router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }
  return <form className="card profile-form" onSubmit={save}>
    <h2>Make yourself at home.</h2><p className="muted">{email}</p>
    <label>First name<input name="first_name" autoComplete="given-name" defaultValue={profile?.first_name ?? ""} required maxLength={80} disabled={busy} /></label>
    <label>Last name<input name="last_name" autoComplete="family-name" defaultValue={profile?.last_name ?? ""} required maxLength={80} disabled={busy} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    {saved && <p role="status" className="success">Your profile is saved. <a href="/takes">Explore City Takes →</a></p>}
    <button disabled={busy} type="submit">{busy ? "Saving…" : "Save profile"}</button>
  </form>;
}
