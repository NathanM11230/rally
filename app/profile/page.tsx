import { MyProfileForm } from "@/components/MyProfileForm";
import { requireUser } from "@/lib/auth";
import { getInstructorProfileByUserId } from "@/lib/instructor-profiles";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  let profile = null;
  let canLoadProfile = true;

  try {
    profile = await getInstructorProfileByUserId(user.id);
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
          <h1>My profile</h1>
          <p className="page-subtitle">
            Rally uses this name and phone number when you are assigned to a
            lesson reminder.
          </p>
        </div>
      </header>

      <section className="panel">
        <MyProfileForm profile={profile} />
      </section>
    </main>
  );
}
