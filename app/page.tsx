import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasName } from "@/lib/auth";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error } = await supabase.from("profiles")
      .select("first_name, last_name").eq("id", user.id).maybeSingle();
    if (!error && !hasName(profile)) redirect("/profile");
  }
  const { data: movies, error } = await supabase.from("movies").select("id,title,year");
  return <main><section className="hero"><p className="eyebrow">THE MOVIE CLUB</p>
    <h1>A little cinema.<br />A lot to talk about.</h1><p>Explore the collection. Find your next favorite.</p></section>
    <section><div className="section-title"><h2>My Movies</h2><span className="muted">THE COLLECTION</span></div>
      {error ? <p role="alert" className="error">We couldn’t load the movies. Please try again shortly.</p>
        : movies?.length ? <ul className="movie-grid">{movies.map((movie, i) => <li className="movie-card" key={movie.id}>
          <span className="movie-number">{String(i + 1).padStart(2, "0")}</span><h3>{movie.title}</h3><p>{movie.year}</p>
        </li>)}</ul> : <p>The collection is coming soon.</p>}
    </section><section className="gate"><div><p className="eyebrow">{user ? "WELCOME BACK" : "MEMBERS ONLY"}</p>
      <h2>{user ? "Your next scene starts here." : "There’s more behind the curtain."}</h2>
      <p>{user ? "Visit the members’ room or update your profile." : "Sign in to unlock the members’ room and create your profile."}</p></div>
      <Link className="button" href={user ? "/members" : "/login"}>{user ? "Enter members’ room" : "Join with Google"} →</Link>
    </section></main>;
}
