import Link from "next/link";

import { ProfileForm } from "@/components/ProfileForm";
import { getCurrentInstructorProfile } from "@/lib/instructor-profiles";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let profile = null;
  let canLoadProfile = true;

  try {
    profile = await getCurrentInstructorProfile();
  } catch {
    canLoadProfile = false;
  }

  if (!canLoadProfile) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Setup needed</p>
            <h1>Instructor profile</h1>
            <p className="lede">
              Add your Supabase environment variables and run the schema before
              setting up an instructor profile.
            </p>
          </div>
          <Link className="button-secondary" href="/">
            Dashboard
          </Link>
        </header>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{profile ? "Edit profile" : "Instructor setup"}</p>
          <h1>{profile ? "Update instructor profile" : "Create instructor profile"}</h1>
          <p className="lede">
            Rally uses this saved phone number to prepare instructor reminder texts.
            You only need to enter it once.
          </p>
        </div>
        <Link className="button-secondary" href="/">
          Dashboard
        </Link>
      </header>

      <section className="panel">
        <ProfileForm profile={profile} />
      </section>
    </main>
  );
}
