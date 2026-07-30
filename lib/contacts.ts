import type { LessonStudentInput } from "@/lib/lesson-input";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Contact, ContactInsert } from "@/types/database";

const CONTACT_SELECT =
  "id, full_name, phone_number, normalized_name, normalized_phone, created_at, updated_at";

export async function getContactDirectory() {
  const [contactData, lessonStudentData, lessonData] = await Promise.all([
    getSavedContactRows(500),
    getLessonStudentContactRows(500),
    getLessonContactRows(500),
  ]);

  return mergeContactResults(
    "",
    contactData,
    [
      ...lessonStudentData.map((student) =>
        lessonHistoryContactToContact("lesson-student", student),
      ),
      ...lessonData.map((lesson) =>
        lessonHistoryContactToContact("lesson", lesson),
      ),
    ],
    500,
  );
}

export async function searchContacts(query: string) {
  const normalizedQuery = normalizeName(query);

  if (!normalizedQuery) {
    return [];
  }

  const [contactData, lessonStudentData, lessonData] = await Promise.all([
    getSavedContactRows(16, normalizedQuery),
    getLessonStudentContactRows(16, query.trim()),
    getLessonContactRows(16, query.trim()),
  ]);

  return mergeContactResults(
    normalizedQuery,
    contactData,
    [
      ...lessonStudentData.map((student) =>
        lessonHistoryContactToContact("lesson-student", student),
      ),
      ...lessonData.map((lesson) =>
        lessonHistoryContactToContact("lesson", lesson),
      ),
    ],
    8,
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
    console.error("Unable to save lesson participants as contacts.", error);
  }
}

export async function upsertContact(input: {
  full_name: string;
  phone_number: string;
}) {
  const fullName = input.full_name.trim();
  const phoneNumber = input.phone_number.trim();
  const normalizedPhone = normalizePhone(phoneNumber);

  if (!fullName) {
    throw new Error("Contact name is required.");
  }

  if (!phoneNumber || !normalizedPhone) {
    throw new Error("Contact phone number is required.");
  }

  const contactRow: ContactInsert = {
    full_name: fullName,
    phone_number: phoneNumber,
    normalized_name: normalizeName(fullName),
    normalized_phone: normalizedPhone,
  };
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contacts")
    .upsert(contactRow, { onConflict: "normalized_phone" })
    .select(CONTACT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as Contact;
}

export function isMissingContactsTableError(error: unknown) {
  return (
    isSupabaseError(error) &&
    error.code === "PGRST205" &&
    error.message.includes("public.contacts")
  );
}

function isSupabaseError(error: unknown): error is {
  code: string;
  message: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

async function getSavedContactRows(limit: number, normalizedQuery?: string) {
  const supabase = getSupabaseAdmin();
  let request = supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .order("full_name", { ascending: true })
    .limit(limit);

  if (normalizedQuery) {
    request = request.ilike("normalized_name", `%${normalizedQuery}%`);
  }

  const { data, error } = await request;

  if (error) {
    return [];
  }

  return (data as Contact[]) ?? [];
}

async function getLessonStudentContactRows(limit: number, searchQuery?: string) {
  const supabase = getSupabaseAdmin();
  let request = supabase
    .from("lesson_students")
    .select("id, student_name, student_phone, created_at")
    .neq("student_phone", "")
    .order("student_name", { ascending: true })
    .limit(limit);

  if (searchQuery) {
    request = request.ilike("student_name", `%${searchQuery}%`);
  }

  const { data, error } = await request;

  if (error) {
    return [];
  }

  return data ?? [];
}

async function getLessonContactRows(limit: number, searchQuery?: string) {
  const supabase = getSupabaseAdmin();
  let request = supabase
    .from("lessons")
    .select("id, student_name, student_phone, created_at")
    .neq("student_phone", "")
    .order(searchQuery ? "created_at" : "student_name", {
      ascending: searchQuery ? false : true,
    })
    .limit(limit);

  if (searchQuery) {
    request = request.ilike("student_name", `%${searchQuery}%`);
  }

  const { data, error } = await request;

  if (error) {
    return [];
  }

  return data ?? [];
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

export function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
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

export function mergeContactResults(
  normalizedQuery: string,
  savedContacts: Contact[],
  lessonContacts: Contact[],
  limit: number,
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
    .slice(0, limit);
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
