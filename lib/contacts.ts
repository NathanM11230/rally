import type { LessonStudentInput } from "@/lib/lesson-input";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Contact, ContactInsert } from "@/types/database";

const CONTACT_SELECT =
  "id, full_name, phone_number, normalized_name, normalized_phone, created_at, updated_at";

export async function getContactDirectory() {
  const supabase = getSupabaseAdmin();
  const { data: contactData, error: contactError } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .order("full_name", { ascending: true })
    .limit(500);

  if (contactError) {
    throw contactError;
  }

  const { data: lessonStudentData, error: lessonStudentError } = await supabase
    .from("lesson_students")
    .select("id, student_name, student_phone, created_at")
    .neq("student_phone", "")
    .order("student_name", { ascending: true })
    .limit(500);

  if (lessonStudentError) {
    throw lessonStudentError;
  }

  const { data: lessonData, error: lessonError } = await supabase
    .from("lessons")
    .select("id, student_name, student_phone, created_at")
    .neq("student_phone", "")
    .order("student_name", { ascending: true })
    .limit(500);

  if (lessonError) {
    throw lessonError;
  }

  return mergeContactResults(
    "",
    (contactData as Contact[]) ?? [],
    [
      ...(lessonStudentData ?? []).map((student) =>
        lessonHistoryContactToContact("lesson-student", student),
      ),
      ...(lessonData ?? []).map((lesson) =>
        lessonHistoryContactToContact("lesson", lesson),
      ),
    ],
  );
}

export async function searchContacts(query: string) {
  const normalizedQuery = normalizeName(query);
  const supabase = getSupabaseAdmin();

  if (!normalizedQuery) {
    return [];
  }

  const { data: contactData, error: contactError } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .ilike("normalized_name", `%${normalizedQuery}%`)
    .order("full_name", { ascending: true })
    .limit(8);

  if (contactError) {
    throw contactError;
  }

  const { data: lessonStudentData, error: lessonStudentError } = await supabase
    .from("lesson_students")
    .select("id, student_name, student_phone, created_at")
    .ilike("student_name", `%${query.trim()}%`)
    .order("student_name", { ascending: true })
    .limit(16);

  if (lessonStudentError) {
    throw lessonStudentError;
  }

  const { data: lessonData, error: lessonError } = await supabase
    .from("lessons")
    .select("id, student_name, student_phone, created_at")
    .ilike("student_name", `%${query.trim()}%`)
    .order("created_at", { ascending: false })
    .limit(16);

  if (lessonError) {
    throw lessonError;
  }

  return mergeContactResults(
    normalizedQuery,
    (contactData as Contact[]) ?? [],
    [
      ...(lessonStudentData ?? []).map((student) =>
        lessonHistoryContactToContact("lesson-student", student),
      ),
      ...(lessonData ?? []).map((lesson) =>
        lessonHistoryContactToContact("lesson", lesson),
      ),
    ],
  );
}

export async function upsertContactsFromStudents(students: LessonStudentInput[]) {
  const contactRows = getUniqueContactRows(students);

  if (contactRows.length === 0) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("contacts")
    .upsert(contactRows, { onConflict: "normalized_phone" });

  if (error) {
    throw error;
  }
}

function getUniqueContactRows(students: LessonStudentInput[]) {
  const rowsByPhone = new Map<string, ContactInsert>();

  for (const student of students) {
    const fullName = student.student_name.trim();
    const phoneNumber = student.student_phone.trim();
    const normalizedPhone = normalizePhone(phoneNumber);

    if (!fullName || !phoneNumber || !normalizedPhone) {
      continue;
    }

    rowsByPhone.set(normalizedPhone, {
      full_name: fullName,
      phone_number: phoneNumber,
      normalized_name: normalizeName(fullName),
      normalized_phone: normalizedPhone,
    });
  }

  return Array.from(rowsByPhone.values());
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function lessonHistoryContactToContact(
  source: "lesson-student" | "lesson",
  contact: {
    id: string;
    student_name: string;
    student_phone: string;
    created_at: string;
  },
): Contact {
  return {
    id: `${source}-${contact.id}`,
    full_name: contact.student_name,
    phone_number: contact.student_phone,
    normalized_name: normalizeName(contact.student_name),
    normalized_phone: normalizePhone(contact.student_phone),
    created_at: contact.created_at,
    updated_at: contact.created_at,
  };
}

function mergeContactResults(
  normalizedQuery: string,
  savedContacts: Contact[],
  lessonContacts: Contact[],
) {
  const contactsByPhone = new Map<string, Contact>();

  for (const contact of [...savedContacts, ...lessonContacts]) {
    if (!contact.normalized_phone) {
      continue;
    }

    if (!contactsByPhone.has(contact.normalized_phone)) {
      contactsByPhone.set(contact.normalized_phone, contact);
    }
  }

  return Array.from(contactsByPhone.values())
    .sort((first, second) => {
      const firstScore = getContactMatchScore(first, normalizedQuery);
      const secondScore = getContactMatchScore(second, normalizedQuery);

      if (firstScore !== secondScore) {
        return firstScore - secondScore;
      }

      return first.full_name.localeCompare(second.full_name);
    })
    .slice(0, 8);
}

function getContactMatchScore(contact: Contact, normalizedQuery: string) {
  const normalizedName = normalizeName(contact.full_name);

  if (normalizedName === normalizedQuery) {
    return 0;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedName.split(" ").some((namePart) => namePart.startsWith(normalizedQuery))) {
    return 2;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 3;
  }

  return 4;
}
