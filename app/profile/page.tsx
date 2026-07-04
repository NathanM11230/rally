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
        </header>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Club pros</h1>
          <p className="page-subtitle">
            Add each pro once. Lessons will use their name and phone for
            reminders.
          </p>
        </div>
      </header>

      <section className="panel">
        <InstructorProfilesManager profiles={profiles ?? []} />
      </section>
    </main>
  );
}
