import Link from "next/link";

import { LessonForm } from "@/components/LessonForm";
import { requireCurrentProfile } from "@/lib/auth";
import { getContactDirectory } from "@/lib/contacts";
import { getLessonTimeZone } from "@/lib/date";
import { getInstructorProfiles } from "@/lib/instructor-profiles";
import type { Contact } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  const { profile } = await requireCurrentProfile();
  let profiles = null;
  let contacts: Contact[] = [];
  const timeZone = getLessonTimeZone();

  try {
    profiles = await getInstructorProfiles();
  } catch {
    profiles = null;
  }

  try {
    contacts = await getContactDirectory();
  } catch {
    contacts = [];
  }

  if (!profiles || profiles.length === 0) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Pros required</p>
            <h1>Complete your profile first</h1>
            <p className="lede">
              Rally needs your pro profile before it can create lesson
              reservations.
            </p>
          </div>
        </header>

        <section className="panel">
          <div className="empty-state">
            Save your name and phone number once, then create your first
            lesson.
            <div className="button-row section-actions">
              <Link className="button" href="/profile">
                Complete profile
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
          <h1>New lesson</h1>
          <p className="page-subtitle">
            Choose the type, one or more pros, participants, time, and court.
          </p>
        </div>
      </header>

      <section className="panel">
        <LessonForm
          mode="create"
          timeZone={timeZone}
          instructorProfiles={profiles}
          defaultInstructorProfileId={profile.id}
          contacts={contacts}
        />
      </section>
    </main>
  );
}
