import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, hasName } from "@/lib/auth";

export default async function Members() {
  const { profile } = await getProfile();
  if (!hasName(profile)) redirect("/profile");
  return <main><section className="hero"><p className="eyebrow">MEMBERS’ ROOM</p>
    <h1>Welcome, {profile!.first_name}.</h1><p>A place for people who stay for the credits.</p></section>
    <section className="card"><p className="eyebrow">TONIGHT’S CONVERSATION</p><h2>What makes a movie worth watching twice?</h2>
      <p>Pick a film from the collection and give it another look. Notice a detail you missed, a line that lands differently, or a character you understand a little better.</p>
      <Link className="button" href="/">Explore the movies →</Link></section>
    <p className="muted">This room is available only to signed-in members. <Link href="/profile">Edit your profile</Link></p>
  </main>;
}
