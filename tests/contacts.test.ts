import assert from "node:assert/strict";
import { test } from "node:test";

import {
  mergeContactResults,
  normalizeName,
  normalizePhone,
} from "../lib/contacts";
import type { Contact } from "../types/database";

test("contact normalization is name-first and formatting-insensitive", () => {
  assert.equal(normalizeName("  Jim   Doe "), "jim doe");
  assert.equal(normalizePhone("+1 (412) 555-0101"), "4125550101");
});

test("saved contacts win over the same lesson-history identity", () => {
  const saved = buildContact("saved-1", "Jim Doe", "(412) 555-0101");
  const history = buildContact(
    "lesson-1",
    "Jim Doe",
    "+1 412 555 0101",
  );

  const result = mergeContactResults("jim", [saved], [history], 8);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "saved-1");
  assert.equal(result[0].full_name, "Jim Doe");
});

test("different people can share one phone number", () => {
  const parent = buildContact("parent", "Sarah Doe", "4125550101");
  const child = buildContact("child", "Molly Doe", "+1 412 555 0101");

  const result = mergeContactResults("", [parent, child], [], 8);

  assert.deepEqual(
    result.map((contact) => contact.full_name),
    ["Molly Doe", "Sarah Doe"],
  );
});

test("ambiguous exact names remain separate autocomplete choices", () => {
  const first = buildContact("first", "Sarah", "4125550101");
  const second = buildContact("second", "Sarah", "4125550102");

  const result = mergeContactResults("sarah", [first, second], [], 8);

  assert.equal(result.length, 2);
});

test("contact matches rank exact, prefix, word prefix, then substring", () => {
  const contacts = [
    buildContact("substring", "Benjamin Jimson", "4125550104"),
    buildContact("word-prefix", "Alex Jimenez", "4125550103"),
    buildContact("prefix", "Jimmy Doe", "4125550102"),
    buildContact("exact", "Jim", "4125550101"),
  ];

  const result = mergeContactResults("jim", contacts, [], 8);

  assert.deepEqual(
    result.map((contact) => contact.id),
    ["exact", "prefix", "word-prefix", "substring"],
  );
});

function buildContact(
  id: string,
  fullName: string,
  phoneNumber: string,
): Contact {
  return {
    id,
    full_name: fullName,
    phone_number: phoneNumber,
    normalized_name: normalizeName(fullName),
    normalized_phone: normalizePhone(phoneNumber),
    created_at: "2026-07-30T12:00:00.000Z",
    updated_at: "2026-07-30T12:00:00.000Z",
  };
}
