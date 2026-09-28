import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignIn } from "@/components/auth-buttons";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/members");
  const { error } = await searchParams;
  return <main className="narrow"><div className="card"><p className="eyebrow">YOUR SEAT IS WAITING</p>
    <h1>Join the club.</h1><p>Sign in to visit the members’ room and make your profile your own.</p>
    {error && <p role="alert" className="error">Sign-in was cancelled or could not be completed. Please try again.</p>}
    <GoogleSignIn /><p className="muted">New here? Your account is created on your first sign-in.</p>
  </div></main>;
}
