import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldRefreshAccessToken } from "../lib/auth-session";

test("access tokens remain valid outside the refresh window", () => {
  const token = buildToken({ exp: 2_000 });

  assert.equal(shouldRefreshAccessToken(token, 1_000), false);
});

test("access tokens refresh shortly before expiry", () => {
  const token = buildToken({ exp: 1_060 });

  assert.equal(shouldRefreshAccessToken(token, 1_000), true);
});

test("missing, malformed, and expired access tokens request a refresh", () => {
  assert.equal(shouldRefreshAccessToken(undefined, 1_000), true);
  assert.equal(shouldRefreshAccessToken("not-a-jwt", 1_000), true);
  assert.equal(shouldRefreshAccessToken(buildToken({ exp: 999 }), 1_000), true);
});

function buildToken(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${header}.${body}.test-signature`;
}
