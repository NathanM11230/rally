import Link from "next/link";

import { ContactDirectory } from "@/components/ContactDirectory";
import { requireCurrentProfile } from "@/lib/auth";
import { getContactDirectory } from "@/lib/contacts";
import type { Contact } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  await requireCurrentProfile();

  let contacts: Contact[] | null = null;

  try {
    contacts = await getContactDirectory();
  } catch (error) {
    console.error("Unable to load Rally contacts.", error);
    contacts = null;
  }

  if (!contacts) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Contacts</h1>
            <p className="lede">
              Rally could not load contacts. Try again in a moment. If this
              continues, check the Supabase connection and Vercel logs.
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
          <h1>Contacts</h1>
          <p className="page-subtitle">
            Automatically saved from lesson names and phone numbers.
          </p>
        </div>
        <Link className="button" href="/contacts/new">
          New contact
        </Link>
      </header>

      {contacts.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No contacts yet. Add a contact or create a lesson with a participant
            name and phone number.
            <div className="button-row section-actions">
              <Link className="button" href="/contacts/new">
                New contact
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <ContactDirectory contacts={contacts} />
      )}
    </main>
  );
}
