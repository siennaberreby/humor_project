import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { SYSTEM_PROMPT, validPrompt } from "@/lib/takes";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Please generate from this website." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to create a caption." }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!validPrompt(body?.prompt)) return Response.json({ error: "Describe your scene in 10–400 characters." }, { status: 400 });
  const key = process.env.GEMINI_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !serviceKey) return Response.json({ error: "The caption studio is not configured yet. Please try again later." }, { status: 503 });
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: allowed, error: quotaError } = await admin.rpc("reserve_generation", { target_user: user.id });
  if (quotaError) return Response.json({ error: "We couldn’t start your caption. Please try again." }, { status: 503 });
  if (!allowed) return Response.json({ error: "Please wait 30 seconds between attempts. Each member gets 10 attempts per 24 hours." }, { status: 429 });
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ role: "user", parts: [{ text: body.prompt.trim() }] }], generationConfig: { temperature: 1, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: "low" } } }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const providerError = await response.json().catch(() => null);
      console.error("Gemini generation failed", { httpStatus: response.status, code: providerError?.error?.code, status: providerError?.error?.status });
      return Response.json({ error: response.status === 429 ? "The AI provider is busy or its quota is used up. Please try again later." : "The AI provider couldn’t create this caption. Please try again later." }, { status: 503 });
    }
    const result = await response.json();
    const candidate = result.candidates?.[0];
    const caption = candidate?.content?.parts?.filter((p: { text?: string; thought?: boolean }) => !p.thought && typeof p.text === "string").map((p: { text: string }) => p.text).join("").trim();
    if (candidate?.finishReason !== "STOP" || !caption || caption.length > 600) return Response.json({ error: "No complete caption was returned. Try a different everyday scene." }, { status: 422 });
    const { data, error } = await admin.from("generations").insert({ user_id: user.id, prompt: body.prompt.trim(), system_prompt: SYSTEM_PROMPT, caption, model }).select("id").single();
    if (error) return Response.json({ error: "Your caption could not be saved. Please try again." }, { status: 500 });
    return Response.json({ id: data.id });
  } catch { return Response.json({ error: "The caption studio timed out. Please try again shortly." }, { status: 503 }); }
}
