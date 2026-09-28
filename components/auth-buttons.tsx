"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function GoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setError("Google sign-in could not start. Please try again."); setBusy(false);
    }
  }
  return <><button onClick={signIn} disabled={busy}>{busy ? "Opening Google…" : "Continue with Google"}</button>
    {error && <p role="alert" className="error">{error}</p>}</>;
}

export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch { setError("Could not sign out. Please retry."); setBusy(false); }
  }
  return <><button className="secondary" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
    {error && <span role="alert">{error}</span>}</>;
}
