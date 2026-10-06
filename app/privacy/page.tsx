import Link from "next/link";

export default function Privacy() {
  return <main className="narrow"><p className="eyebrow">MOVIE CLUB</p><h1>Privacy</h1>
    <section className="card"><h2>What this app stores</h2>
      <p>Movie Club is a student class project. When you sign in with Google, Supabase processes your Google account identifier, email address, and basic profile information to create and manage your account. The app does not request access to your Gmail, Drive, or Calendar.</p>
      <p>The first and last names you enter are stored in your profile. Photo upload is no longer part of the profile form. Previously uploaded photos, if any, remain in private storage.</p>
      <h2>How your information is used</h2><p>Your information is used to sign you in, display your profile, and provide access to the members’ room. Authentication cookies keep you signed in. Supabase provides authentication and storage, and Vercel hosts the app; these services may process request and operational logs.</p>
      <h2>AI captions and votes</h2><p>Scenes you submit are sent to Google Gemini to generate a caption. Your scene, the generation instructions, and the resulting caption are stored in Supabase. Scenes and captions are public, including through shared links. Do not include private information. Votes are linked to your account; other visitors see only aggregate totals. Generation attempts are recorded to enforce usage limits.</p><h2>Your choices</h2><p>You can change your names on the Profile page, or sign out at any time. Account and profile data remain stored until removed. To request account or photo deletion, contact <a href="mailto:seb2290@columbia.edu">seb2290@columbia.edu</a>.</p>
      <Link href="/">Back to Movie Club →</Link></section></main>;
}
