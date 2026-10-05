import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOut } from "@/components/auth-buttons";

export async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <header><Link className="brand" href="/">Movie Club<span>GOOD FILMS. GREAT COMPANY.</span></Link>
    <nav aria-label="Main navigation"><Link href="/takes">City Takes</Link><Link href="/movies">Movies</Link>
      {user ? <><Link href="/members">Members</Link><Link href="/profile">Profile</Link><SignOut /></>
        : <Link className="button" href="/login">Sign in</Link>}
    </nav></header>;
}
