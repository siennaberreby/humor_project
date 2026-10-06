import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasName } from "@/lib/auth";
import { dailyPrompt } from "@/lib/takes";
import { Generator, Share, VoteControls } from "@/components/take-controls";
type Take = { id: string; prompt: string; caption: string; created_at: string };
export default async function Takes({ searchParams }: { searchParams: Promise<{ sort?: string; post?: string }> }) {
  const { sort, post } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("first_name,last_name").eq("id",user.id).maybeSingle();
    if (!hasName(profile)) redirect("/profile");
  }
  const validPost = post && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post);
  let query = supabase.from("generations").select("id,prompt,caption,created_at").order("created_at",{ascending:false}).limit(100);
  if (validPost) query = query.eq("id",post);
  const { data, error } = await query;
  const takes: Take[] = data ?? [];
  const ids = takes.map(t=>t.id);
  const { data: scores, error: scoreError } = ids.length ? await supabase.rpc("caption_scores", { ids }) : { data: [], error: null };
  const { data: votes } = user && ids.length ? await supabase.from("votes").select("generation_id,value").eq("user_id",user.id).in("generation_id",ids) : { data: [] };
  const scoreMap = new Map<string,{score:number;vote_count:number}>((scores ?? []).map((s: { generation_id: string; score: number; vote_count: number })=>[s.generation_id,s]));
  const voteMap = new Map((votes ?? []).map(v=>[v.generation_id,v.value]));
  if(sort === "top") takes.sort((a,b)=>(scoreMap.get(b.id)?.score??0)-(scoreMap.get(a.id)?.score??0));
  return <main><section className="hero takes-hero"><p className="eyebrow">MOVIE CLUB PRESENTS · CITY TAKES</p><h1>Main character.<br/>Minor inconvenience.</h1><p>Campus chaos. NYC weekends. AI-written taglines, judged by you.</p></section>
    <div className="takes-layout"><aside>{user ? <Generator daily={dailyPrompt()} /> : <section className="card"><p className="eyebrow">JOIN THE WRITERS’ ROOM</p><h2>Your next commute could be a comedy.</h2><p>Sign in to generate a caption and vote for the ones worth sharing.</p><Link className="button" href="/login">Continue with Google →</Link></section>}</aside>
    <section aria-label="Caption feed"><div className="section-title"><h2>{post ? "The scene" : "The feed"}</h2><div className="feed-tabs"><Link aria-current={!post && sort !== "top" ? "page" : undefined} href="/takes">Fresh</Link><Link aria-current={!post && sort === "top" ? "page" : undefined} href="/takes?sort=top">Top</Link></div></div><p className="muted">{post ? "Share a laugh. Cast your vote." : "Latest 100 scenes. One vote per person; you can change your mind."}</p>
    {error || scoreError ? <p role="alert" className="error">The feed couldn’t load. Please refresh in a moment.</p> : takes.length ? takes.map(t=>{const stats=scoreMap.get(t.id);return <article className="card take-card" key={t.id}><div className="take-meta"><span>AI GENERATED</span><time dateTime={t.created_at}>{new Date(t.created_at).toLocaleDateString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric"})}</time></div><blockquote>{t.caption}</blockquote><details><summary>The scene behind it</summary><p>{t.prompt}</p></details><VoteControls id={t.id} initialVote={voteMap.get(t.id)??0} score={stats?.score??0} count={stats?.vote_count??0} signedIn={Boolean(user)}/><div className="share-row"><Link href={`/takes?post=${t.id}`}>Open post</Link><Share id={t.id}/></div></article>}) : <section className="card"><h2>{post ? "Scene not found." : "Opening credits."}</h2><p>{post ? "This post is no longer available. Explore the fresh feed." : "Be the first to turn an everyday NYC moment into a caption."}</p></section>}
    </section></div></main>;
}
