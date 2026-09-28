import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

export async function getProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase.from("profiles")
    .select("first_name, last_name, avatar_path").eq("id", user.id).maybeSingle();
  if (error) throw new Error("Your profile could not be loaded. Please try again.");
  return { supabase, user, profile };
}

export function hasName(profile: { first_name: string | null; last_name: string | null } | null) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}
