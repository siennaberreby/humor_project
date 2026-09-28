# Movie Club — Assignment 3: Auth Week

Extends the Assignment 2 movie app in the same repository, Vercel project, and Supabase project.

## Features

- Google OAuth sign-in using `@supabase/ssr` and cookie-based browser/server clients.
- `/auth/callback` exchanges the authorization code for a session. The requested redirect has no extra query parameters.
- New auth users get a `profiles` row from a SQL trigger. First and last names are nullable in the database.
- Missing names lead to `/profile` after login and on visits to the home or members pages.
- `/profile` lets members edit their names and upload a JPEG, PNG, or WebP photo (5 MB maximum).
- Photos are private Supabase Storage objects. The profile stores only the object path; signed URLs display the photo.
- `/members` and `/profile` verify the user on the server. Signed-out visitors go to `/login`.
- Public home page retains the movie list and shows different navigation and gated content according to authentication state.
- Profile and Storage policies restrict access to the current user's own data.

## Run locally

```sh
npm ci
cp .env.example .env.local
# Fill in the existing project's URL and publishable key.
npm run dev
```

Use the existing Supabase project `gpkbjqwzgbittzsxmmjs` in the Sienna organization. Never put a service-role key or Google client secret in a `NEXT_PUBLIC_` variable.

## Existing project setup

1. Apply `supabase/migrations/202609280001_profiles.sql` once in the existing project's SQL Editor. It creates the profiles table, user trigger, policies, private avatars bucket, and backfills profiles for existing users.
2. In Google Auth Platform, configure the consent screen and create a **Web application** OAuth client. Request only `openid`, email, and profile scopes. Add test users if the consent screen is in Testing, including any account used to grade the app.
3. Authorized JavaScript origins: `http://localhost:3000` and `https://humor-project-mu.vercel.app`.
4. Google's authorized redirect URI is `https://gpkbjqwzgbittzsxmmjs.supabase.co/auth/v1/callback`. This is Google's callback into Supabase, distinct from the app callback below.
5. Enable Google in Supabase Authentication → Sign In / Providers. Save your Google client ID and secret there.
6. Set Supabase's Site URL to `https://humor-project-mu.vercel.app`. Add `http://localhost:3000/auth/callback`, `https://humor-project-mu.vercel.app/auth/callback`, and the exact final commit deployment URL ending in `/auth/callback` to the redirect allow list.
7. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set in the existing Vercel project for the deployment environment.
8. Deploy the commit in the existing Vercel project. Ensure deployment protection is disabled as required by the assignment, so the commit-specific URL is accessible in Incognito.

## Validation

```sh
npm run lint
npm run build
```

Live acceptance checks:

- Incognito: `/` displays movies and a sign-in gate; `/members` and `/profile` redirect to `/login`.
- Google sign-in returns through `/auth/callback` on the same deployment origin.
- New users receive exactly one profile row and are prompted for missing names.
- Names save and persist after reload. Blank/whitespace names are rejected by the form.
- Photo upload persists after reload; invalid formats and files above 5 MB are rejected.
- A second account cannot read or update another account's profile or avatar.
- Completed profiles reach `/members`. Sign-out restores the gate and blocks direct route access.
- Submit the immutable, commit-specific Vercel URL, not the moving production alias.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Google provider](https://supabase.com/docs/guides/auth/social-login/auth-google).
