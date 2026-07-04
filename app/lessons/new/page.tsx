import Link from "next/link";

import { LessonForm } from "@/components/LessonForm";
import { getLessonTimeZone } from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  let profiles = null;
  const timeZone = getLessonTimeZone();

  try {
    profiles = await getInstructorProfiles();
  } catch {
    profiles = null;
  }

  if (!profiles || profiles.length === 0) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Pros required</p>
            <h1>Add your club pros first</h1>
            <p className="lede">
              Rally needs at least one saved pro before it can create lesson
              reservations.
            </p>
          </div>
        </header>

        <section className="panel">
          <div className="empty-state">
            Add each pro once, then select the right pro when creating each
            lesson.
            <div className="button-row section-actions">
              <Link className="button" href="/profile">
                Add club pros
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">New lesson</p>
          <h1>Create a tennis lesson</h1>
          <p className="lede">
            Choose the pro, add one or more students, and enter the time and court
            details.
          </p>
          <div className="details-bar">
            {profiles.map((profile) => (
              <span className="detail-chip" key={profile.id}>
                {profile.full_name}: {profile.phone_number}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="panel">
        <LessonForm mode="create" timeZone={timeZone} instructorProfiles={profiles} />
      </section>
    </main>
  );
}
