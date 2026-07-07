import { requireCurrentProfile } from "@/lib/auth";
import { formatLessonDateTime, getLessonTimeZone } from "@/lib/date";
import { getLessonsForInstructor } from "@/lib/lessons";
import { getLessonStudents } from "@/lib/manual-sms";
import type { LessonWithInstructorProfile } from "@/types/database";

type FollowUpContact = {
  id: string;
  fullName: string;
  firstName: string;
  phoneNumber: string;
  lessonCount: number;
  lastLesson: LessonWithInstructorProfile;
};

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const { profile } = await requireCurrentProfile();
  const timeZone = getLessonTimeZone();

  let lessons: LessonWithInstructorProfile[] | null = null;

  try {
    lessons = await getLessonsForInstructor(profile.id);
  } catch {
    lessons = null;
  }

  if (!lessons) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Follow ups</h1>
            <p className="lede">
              Add your Supabase environment variables before Rally can load
              follow ups.
            </p>
          </div>
        </header>
      </main>
    );
  }

  const contacts = getFollowUpContacts(lessons);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Follow ups</h1>
          <p className="page-subtitle">
            Quick text links for people you work with most.
          </p>
        </div>
      </header>

      {contacts.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No follow ups yet. Add lessons with names and phone numbers first.
          </div>
        </section>
      ) : (
        <section className="dash-section">
          <h2 className="section-title">
            {contacts.length} {contacts.length === 1 ? "person" : "people"}
          </h2>
          <div className="follow-up-grid">
            {contacts.map((contact) => (
              <FollowUpCard
                contact={contact}
                key={contact.id}
                timeZone={timeZone}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function FollowUpCard({
  contact,
  timeZone,
}: {
  contact: FollowUpContact;
  timeZone: string;
}) {
  const message = `Hey ${contact.firstName}, any time to hit soon?`;

  return (
    <div className="follow-up-card">
      <div>
        <h3>{contact.fullName}</h3>
        <p>{contact.phoneNumber}</p>
      </div>
      <div className="follow-up-meta">
        <span>
          <strong>{contact.lessonCount}</strong>{" "}
          {contact.lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <span>Last: {formatLessonDateTime(contact.lastLesson, timeZone)}</span>
      </div>
      <a className="button compact-button" href={buildSmsHref(contact.phoneNumber, message)}>
        Text
      </a>
    </div>
  );
}

function getFollowUpContacts(lessons: LessonWithInstructorProfile[]) {
  const contactsByPhone = new Map<string, FollowUpContact>();

  for (const lesson of lessons) {
    for (const person of getLessonStudents(lesson)) {
      const phoneKey = normalizePhone(person.student_phone);
      const fullName = person.student_name.trim();

      if (!phoneKey || !fullName) {
        continue;
      }

      const existingContact = contactsByPhone.get(phoneKey);

      if (!existingContact) {
        contactsByPhone.set(phoneKey, {
          id: phoneKey,
          fullName,
          firstName: getFirstName(fullName),
          phoneNumber: person.student_phone,
          lessonCount: 1,
          lastLesson: lesson,
        });
        continue;
      }

      existingContact.lessonCount += 1;

      if (
        new Date(lesson.lesson_start_time).getTime() >
        new Date(existingContact.lastLesson.lesson_start_time).getTime()
      ) {
        existingContact.lastLesson = lesson;
      }
    }
  }

  return Array.from(contactsByPhone.values()).sort((first, second) => {
    if (second.lessonCount !== first.lessonCount) {
      return second.lessonCount - first.lessonCount;
    }

    return (
      new Date(second.lastLesson.lesson_start_time).getTime() -
      new Date(first.lastLesson.lesson_start_time).getTime()
    );
  });
}

function buildSmsHref(phoneNumber: string, message: string) {
  return `sms:${cleanPhoneNumber(phoneNumber)}?body=${encodeURIComponent(message)}`;
}

function cleanPhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

function normalizePhone(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
