import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ensureInstructorIsAssigned,
  getPrimaryInstructorProfileId,
} from "../lib/lesson-instructors";

test("the editing pro is assigned without changing selected pro order", () => {
  assert.deepEqual(
    ensureInstructorIsAssigned(["pro-a", "pro-b"], "pro-b"),
    ["pro-a", "pro-b"],
  );
  assert.deepEqual(
    ensureInstructorIsAssigned(["pro-a"], "pro-b"),
    ["pro-a", "pro-b"],
  );
});

test("the existing primary pro is preserved while still assigned", () => {
  assert.equal(
    getPrimaryInstructorProfileId(["pro-b", "pro-a"], "pro-a"),
    "pro-a",
  );
});

test("the first selected pro becomes primary after the old primary is removed", () => {
  assert.equal(
    getPrimaryInstructorProfileId(["pro-b", "pro-c"], "pro-a"),
    "pro-b",
  );
  assert.equal(getPrimaryInstructorProfileId([]), null);
});
