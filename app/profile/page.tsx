import { getProfile, hasName } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function Profile() {
  const { user, profile } = await getProfile();
  return <main className="narrow"><p className="eyebrow">YOUR MEMBERSHIP</p><h1>Your profile.</h1>
    {!hasName(profile) && <p className="notice">Welcome! Add your first and last name to finish joining the club.</p>}
    <ProfileForm userId={user.id} email={user.email ?? ""} profile={profile} />
  </main>;
}
