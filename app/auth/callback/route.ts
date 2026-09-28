import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasName } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && !url.searchParams.has("error")) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: profile } = await supabase.from("profiles")
        .select("first_name, last_name").eq("id", data.user.id).maybeSingle();
      return NextResponse.redirect(new URL(hasName(profile) ? "/members" : "/profile", url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}
