import Link from "next/link";

import { ContactForm } from "@/components/ContactForm";
import { requireCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  await requireCurrentProfile();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>New contact</h1>
          <p className="page-subtitle">
            Save a name and phone number once, then reuse it when creating lessons.
          </p>
        </div>
        <Link className="button-secondary" href="/contacts">
          Contacts
        </Link>
      </header>

      <section className="panel">
        <ContactForm />
      </section>
    </main>
  );
}
