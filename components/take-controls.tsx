"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
export function Generator({ daily }: { daily: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(daily);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function generate(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not generate a caption.");
      router.push(`/takes?post=${result.id}`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Connection lost. Please try again."); }
    finally { setBusy(false); }
  }
  return <form className="card studio" onSubmit={generate}><p className="eyebrow">YOUR LIFE, THE MOVIE</p><h2>Give an ordinary scene a ridiculous tagline.</h2>
    <label htmlFor="scene">What happened?</label><textarea id="scene" value={prompt} onChange={e => setPrompt(e.target.value)} minLength={10} maxLength={400} required rows={4} disabled={busy} />
    <div className="form-meta"><button type="button" className="text-button" onClick={() => setPrompt(daily)} disabled={busy}>Use today’s prompt</button><span>{prompt.length}/400</span></div>
    <p className="muted">Your scene and AI caption will be public. Leave out names and private details. 10 attempts per 24 hours; 30 seconds between attempts.</p>
    <button disabled={busy || prompt.trim().length < 10}>{busy ? "Writing your scene…" : "Generate & publish →"}</button>
    <p role="status" aria-live="polite">{busy ? "Turning everyday chaos into cinema. This can take up to a minute." : ""}</p>
    {error && <p className="error" role="alert">{error}</p>}
  </form>;
}
export function VoteControls({ id, initialVote, score, count, signedIn }: { id: string; initialVote: number; score: number; count: number; signedIn: boolean }) {
  const [vote, setVote] = useState(initialVote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function cast(value: number) {
    if (busy || vote === value) return;
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in again to vote.");
      let { error } = await supabase.from("votes").insert({ generation_id: id, user_id: user.id, value });
      if (error?.code === "23505") {
        ({ error } = await supabase.from("votes").update({ value }).eq("generation_id", id).eq("user_id", user.id));
      }
      if (error) throw new Error("Your vote wasn’t saved. Please try again.");
      setVote(value); router.refresh();
    } catch(e) { setError(e instanceof Error ? e.message : "Could not save your vote."); }
    finally { setBusy(false); }
  }
  return <div><div className="vote-row">{signedIn ? <><button className={vote === 1 ? "vote active" : "vote secondary"} aria-pressed={vote === 1} aria-label="Upvote caption" disabled={busy} onClick={() => cast(1)}>↑ Made me laugh</button><button className={vote === -1 ? "vote active" : "vote secondary"} aria-pressed={vote === -1} aria-label="Downvote caption" disabled={busy} onClick={() => cast(-1)}>↓ Not quite</button></> : <Link href="/login">Sign in to vote</Link>}<span className="muted">{score} score · {count} {count === 1 ? "vote" : "votes"}</span></div>{error && <p className="error" role="alert">{error}</p>}<span className="sr-only" role="status">{vote ? "Your vote is saved." : ""}</span></div>;
}
export function Share({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  return <div><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/takes?post=${id}`); setMessage("Link copied"); } catch { setMessage("Open this post and copy its URL from your address bar."); } }}>Copy link ↗</button><span className="muted" role="status"> {message}</span></div>;
}
