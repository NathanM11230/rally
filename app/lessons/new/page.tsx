import Link from "next/link";

import { LessonForm } from "@/components/LessonForm";
import { getLessonTimeZone } from "@/lib/date";
import { getCurrentInstructorProfile } from "@/lib/instructor-profiles";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  let profile = null;
  const timeZone = getLessonTimeZone();

  try {
    profile = await getCurrentInstructorProfile();
  } catch {
    profile = null;
  }

  if (!profile) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Profile required</p>
            <h1>Set up your instructor profile first</h1>
            <p className="lede">
              Rally needs your saved instructor name and phone number before it can
              create SMS lesson reminders.
            </p>
          </div>
          <Link className="button-secondary" href="/">
            Dashboard
          </Link>
        </header>

        <section className="panel">
          <div className="empty-state">
            Create your instructor profile once, then Rally will automatically attach
            it to every new lesson.
            <div className="button-row section-actions">
              <Link className="button" href="/profile">
                Set up instructor profile
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
            Add the student, time, and court details. Rally will use your saved
            instructor phone number to prepare reminder texts.
          </p>
          <div className="details-bar">
            <span className="detail-chip">Instructor: {profile.full_name}</span>
            <span className="detail-chip">SMS phone: {profile.phone_number}</span>
          </div>
        </div>
        <Link className="button-secondary" href="/">
          Dashboard
        </Link>
      </header>

      <section className="panel">
        <LessonForm mode="create" timeZone={timeZone} />
      </section>
    </main>
  );
}
