import assert from "node:assert/strict";
import { test } from "node:test";

import { parseInviteFragment } from "../lib/invite-fragment";

test("invite fragments return the Supabase session credentials", () => {
  const result = parseInviteFragment(
    "#access_token=access-value&refresh_token=refresh-value&type=invite",
  );

  assert.deepEqual(result, {
    ok: true,
    credentials: {
      accessToken: "access-value",
      refreshToken: "refresh-value",
    },
  });
});

test("invite fragments reject missing session credentials", () => {
  const result = parseInviteFragment("#type=invite");

  assert.equal(result.ok, false);
});

test("invite fragments surface Supabase invitation errors", () => {
  const result = parseInviteFragment(
    "#error=access_denied&error_description=Email+link+has+expired",
  );

  assert.deepEqual(result, {
    ok: false,
    error: "Email link has expired",
  });
});
