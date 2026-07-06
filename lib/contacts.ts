import type { LessonStudentInput } from "@/lib/lesson-input";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Contact, ContactInsert } from "@/types/database";

const CONTACT_SELECT =
  "id, full_name, phone_number, normalized_name, normalized_phone, created_at, updated_at";

export async function searchContacts(query: string) {
  const normalizedQuery = normalizeName(query);
  const supabase = getSupabaseAdmin();

  if (!normalizedQuery) {
    return [];
  }

  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    .ilike("normalized_name", `%${normalizedQuery}%`)
    .order("full_name", { ascending: true })
    .limit(8);

  if (error) {
    throw error;
  }

  return data as Contact[];
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
