"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Contact } from "@/types/database";

type ContactDirectoryProps = {
  contacts: Contact[];
};

export function ContactDirectory({ contacts }: ContactDirectoryProps) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const matchingContacts = useMemo(
    () => getMatchingContacts(contacts, trimmedQuery),
    [contacts, trimmedQuery],
  );

  return (
    <section className="dash-section">
      <div className="contact-search-panel">
        <label className="field">
          Search saved contacts
          <input
            type="search"
            value={query}
            placeholder="Type a name, like Jim"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p>
          {contacts.length} saved {contacts.length === 1 ? "contact" : "contacts"}.
          Start typing to filter by name or phone.
        </p>
      </div>

      {trimmedQuery.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            Type a few letters to find a saved contact.
          </div>
        </section>
      ) : matchingContacts.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            No saved contacts match <strong>{trimmedQuery}</strong>.
          </div>
        </section>
      ) : (
        <>
          <h2 className="section-title">
            {matchingContacts.length}{" "}
            {matchingContacts.length === 1 ? "match" : "matches"}
          </h2>
          <div className="contact-directory-grid">
            {matchingContacts.map((contact) => (
              <ContactCard contact={contact} key={contact.id} />
            ))}
          </div>
        </>
      )}
    </section>
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

function getMatchingContacts(contacts: Contact[], query: string) {
  const normalizedQuery = normalizeText(query);
  const normalizedPhoneQuery = query.replace(/\D/g, "");

  if (!normalizedQuery && !normalizedPhoneQuery) {
    return [];
  }

  return [...contacts]
    .filter((contact) => {
      const normalizedName = normalizeText(contact.full_name);
      const normalizedPhone = contact.phone_number.replace(/\D/g, "");

      return (
        normalizedName.includes(normalizedQuery) ||
        (normalizedPhoneQuery.length > 0 && normalizedPhone.includes(normalizedPhoneQuery))
      );
    })
    .sort((first, second) => {
      const firstScore = getMatchScore(first, normalizedQuery);
      const secondScore = getMatchScore(second, normalizedQuery);

      if (firstScore !== secondScore) {
        return firstScore - secondScore;
      }

      return first.full_name.localeCompare(second.full_name);
    })
    .slice(0, 25);
}

function getMatchScore(contact: Contact, normalizedQuery: string) {
  const normalizedName = normalizeText(contact.full_name);

  if (normalizedName === normalizedQuery) {
    return 0;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedName.split(" ").some((namePart) => namePart.startsWith(normalizedQuery))) {
    return 2;
  }

  return 3;
}

function buildSmsHref(phoneNumber: string) {
  return `sms:${phoneNumber.replace(/[^\d+]/g, "")}`;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
