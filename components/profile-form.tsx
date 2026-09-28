"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Profile = { first_name: string | null; last_name: string | null; avatar_path: string | null };
const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function ProfileForm({ userId, email, profile, avatarUrl }: {
  userId: string; email: string; profile: Profile | null; avatarUrl?: string;
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
    const photo = data.get("photo");
    if (photo instanceof File && photo.size && (!types[photo.type] || photo.size > 5 * 1024 * 1024)) {
      setError("Choose a JPEG, PNG, or WebP image smaller than 5 MB."); return;
    }
    setBusy(true);
    const supabase = createClient();
    let uploaded: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== userId) throw new Error("Your session expired. Please sign in again.");
      let path = profile?.avatar_path ?? null;
      if (photo instanceof File && photo.size) {
        uploaded = `${user.id}/${crypto.randomUUID()}.${types[photo.type]}`;
        const { error } = await supabase.storage.from("avatars").upload(uploaded, photo, { contentType: photo.type });
        if (error) throw new Error("Your photo could not be uploaded. Please try again.");
        path = uploaded;
      }
      const { error } = await supabase.from("profiles").upsert({ id: user.id, first_name: first, last_name: last, avatar_path: path });
      if (error) throw new Error("Your profile could not be saved. Please try again.");
      // Once the row is saved, its photo must not be removed on a later cleanup failure.
      uploaded = null;
      if (path && profile?.avatar_path && path !== profile.avatar_path) {
        await supabase.storage.from("avatars").remove([profile.avatar_path]).catch(() => {});
      }
      const input = form.elements.namedItem("photo") as HTMLInputElement;
      input.value = "";
      setSaved(true); router.refresh();
    } catch (error) {
      if (uploaded) await supabase.storage.from("avatars").remove([uploaded]).catch(() => {});
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }
  return <form className="card profile-form" onSubmit={save}>
    <div className="avatar-row">{avatarUrl
      // Signed Storage URLs expire and should not be cached by the image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img className="avatar" src={avatarUrl} alt="Your profile photo" />
      : <div className="avatar placeholder" aria-label="No profile photo">{profile?.first_name?.[0] ?? "M"}</div>}
      <div><h2>Make yourself at home.</h2><p className="muted">{email}</p></div></div>
    <label>First name<input name="first_name" autoComplete="given-name" defaultValue={profile?.first_name ?? ""} required maxLength={80} disabled={busy} /></label>
    <label>Last name<input name="last_name" autoComplete="family-name" defaultValue={profile?.last_name ?? ""} required maxLength={80} disabled={busy} /></label>
    <label>Profile photo <span className="muted">(optional)</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-describedby="photo-help" /></label>
    <p className="muted" id="photo-help">JPEG, PNG, or WebP. Maximum 5 MB.</p>
    {error && <p role="alert" className="error">{error}</p>}
    {saved && <p role="status" className="success">Your profile is saved. <a href="/members">Visit the members’ room →</a></p>}
    <button disabled={busy} type="submit">{busy ? "Saving…" : "Save profile"}</button>
  </form>;
}
