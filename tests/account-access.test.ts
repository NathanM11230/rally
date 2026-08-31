import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRallyAccessMetadata,
  hasRallyAccess,
} from "../lib/account-access";

test("Rally access requires a trusted app metadata claim", () => {
  assert.equal(hasRallyAccess({ app_metadata: { rally_access: true } }), true);
  assert.equal(hasRallyAccess({ app_metadata: { rally_access: false } }), false);
  assert.equal(hasRallyAccess({ app_metadata: {} }), false);
});

test("Rally access metadata preserves existing server claims", () => {
  const metadata = buildRallyAccessMetadata({ provider: "email" });

  assert.deepEqual(metadata, {
    provider: "email",
    rally_access: true,
  });
});
