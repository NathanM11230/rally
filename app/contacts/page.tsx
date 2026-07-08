import Link from "next/link";

import { requireCurrentProfile } from "@/lib/auth";
import { getContactDirectory } from "@/lib/contacts";
import type { Contact } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  await requireCurrentProfile();

  let contacts: Contact[] | null = null;

  try {
    contacts = await getContactDirectory();
  } catch {
    contacts = null;
  }

  if (!contacts) {
    return (
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Contacts</h1>
            <p className="lede">
              Add your Supabase environment variables before Rally can load contacts.
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
        <Link className="button" href="/lessons/new">
          New lesson
        </Link>
      </header>

      {contacts.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No contacts yet. Add a lesson with a participant name and phone number first.
          </div>
        </section>
      ) : (
        <section className="dash-section">
          <h2 className="section-title">
            {contacts.length} saved {contacts.length === 1 ? "contact" : "contacts"}
          </h2>
          <div className="contact-directory-grid">
            {contacts.map((contact) => (
              <ContactCard contact={contact} key={contact.id} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="contact-directory-card">
      <div>
        <h3>{contact.full_name}</h3>
        <p>{contact.phone_number}</p>
      </div>
      <div className="button-row">
        <a className="button-secondary compact-button" href={buildSmsHref(contact.phone_number)}>
          Text
        </a>
        <Link className="button-secondary compact-button" href="/lessons/new">
          New lesson
        </Link>
      </div>
    </div>
  );
}

function buildSmsHref(phoneNumber: string) {
  return `sms:${phoneNumber.replace(/[^\d+]/g, "")}`;
}
