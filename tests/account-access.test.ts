import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRallyInvitationMetadata,
  buildRallyAccessMetadata,
  hasRallyAccess,
  hasRallyInvitation,
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
    rally_invited: false,
  });
});

test("Rally invitations are temporary and do not grant application access", () => {
  const metadata = buildRallyInvitationMetadata({ provider: "email" });

  assert.deepEqual(metadata, {
    provider: "email",
    rally_access: false,
    rally_invited: true,
  });
  assert.equal(hasRallyInvitation({ app_metadata: metadata }), true);
  assert.equal(hasRallyAccess({ app_metadata: metadata }), false);
});

test("grant metadata consumes the temporary Rally invitation", () => {
  const metadata = buildRallyAccessMetadata(buildRallyInvitationMetadata());

  assert.equal(hasRallyInvitation({ app_metadata: metadata }), false);
  assert.equal(hasRallyAccess({ app_metadata: metadata }), true);
});
