import Link from "next/link";

import { InstructorProfilesManager } from "@/components/InstructorProfilesManager";
import { getInstructorProfiles } from "@/lib/instructor-profiles";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let profiles = null;
  let canLoadProfile = true;

  try {
    profiles = await getInstructorProfiles();
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
          <p className="eyebrow">Club roster</p>
          <h1>Manage tennis pros</h1>
          <p className="lede">
            Add each pro once. Lessons can then be assigned to the right pro, and
            Rally will prepare reminder texts with that pro&apos;s name and phone number.
          </p>
        </div>
        <Link className="button-secondary" href="/">
          Dashboard
        </Link>
      </header>

      <section className="panel">
        <InstructorProfilesManager profiles={profiles ?? []} />
      </section>
    </main>
  );
}
