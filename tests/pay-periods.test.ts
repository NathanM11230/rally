import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getPayPeriodForDate,
  getPayPeriodQueryRange,
  shiftPayPeriod,
} from "../lib/pay-periods";

const TIME_ZONE = "America/New_York";

test("pay period begins on the configured anchor Monday", () => {
  assert.deepEqual(
    getPayPeriodForDate(new Date("2026-07-06T16:00:00.000Z"), TIME_ZONE),
    {
      startDateKey: "2026-07-06",
      endDateKey: "2026-07-19",
      nextStartDateKey: "2026-07-20",
    },
  );
});

test("dates before the anchor fall into the previous 14-day period", () => {
  assert.deepEqual(
    getPayPeriodForDate(new Date("2026-07-05T16:00:00.000Z"), TIME_ZONE),
    {
      startDateKey: "2026-06-22",
      endDateKey: "2026-07-05",
      nextStartDateKey: "2026-07-06",
    },
  );
});

test("pay periods shift in exact 14-day increments", () => {
  const current = getPayPeriodForDate(
    new Date("2026-07-10T16:00:00.000Z"),
    TIME_ZONE,
  );

  assert.equal(shiftPayPeriod(current, 1).startDateKey, "2026-07-20");
  assert.equal(shiftPayPeriod(current, -1).startDateKey, "2026-06-22");
});

test("query ranges honor timezone changes across daylight saving time", () => {
  const range = getPayPeriodQueryRange(
    {
      startDateKey: "2026-10-26",
      endDateKey: "2026-11-08",
      nextStartDateKey: "2026-11-09",
    },
    TIME_ZONE,
  );

  assert.equal(range.start.toISOString(), "2026-10-26T04:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-11-09T05:00:00.000Z");
});
