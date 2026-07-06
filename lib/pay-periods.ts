import { dateAndTimeToUtc, formatDateKeyInTimeZone, getLessonTimeZone } from "@/lib/date";

const PAY_PERIOD_ANCHOR_DATE = "2026-07-06";
const PAY_PERIOD_LENGTH_DAYS = 14;

export type PayPeriod = {
  startDateKey: string;
  endDateKey: string;
  nextStartDateKey: string;
};

export function getCurrentPayPeriod(timeZone = getLessonTimeZone()) {
  return getPayPeriodForDate(new Date(), timeZone);
}

export function getPayPeriodForDate(date: Date, timeZone = getLessonTimeZone()) {
  const dateKey = formatDateKeyInTimeZone(date, timeZone);
  const daysSinceAnchor = getDayDifference(PAY_PERIOD_ANCHOR_DATE, dateKey);
  const periodIndex = Math.floor(daysSinceAnchor / PAY_PERIOD_LENGTH_DAYS);

  return buildPayPeriod(addDays(PAY_PERIOD_ANCHOR_DATE, periodIndex * PAY_PERIOD_LENGTH_DAYS));
}

export function getPayPeriodFromStartDate(startDateKey: string | undefined, timeZone: string) {
  if (!startDateKey || !/^\d{4}-\d{2}-\d{2}$/.test(startDateKey)) {
    return getCurrentPayPeriod(timeZone);
  }

  return buildPayPeriod(startDateKey);
}

export function shiftPayPeriod(period: PayPeriod, amount: number) {
  return buildPayPeriod(addDays(period.startDateKey, amount * PAY_PERIOD_LENGTH_DAYS));
}

export function getPayPeriodQueryRange(period: PayPeriod, timeZone: string) {
  return {
    start: dateAndTimeToUtc(period.startDateKey, "00:00", timeZone),
    end: dateAndTimeToUtc(period.nextStartDateKey, "00:00", timeZone),
  };
}

export function formatPayPeriodLabel(period: PayPeriod) {
  const start = parseDateKey(period.startDateKey);
  const end = parseDateKey(period.endDateKey);
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  return `${startLabel} - ${endLabel}`;
}

function buildPayPeriod(startDateKey: string): PayPeriod {
  return {
    startDateKey,
    endDateKey: addDays(startDateKey, PAY_PERIOD_LENGTH_DAYS - 1),
    nextStartDateKey: addDays(startDateKey, PAY_PERIOD_LENGTH_DAYS),
  };
}

function getDayDifference(startDateKey: string, endDateKey: string) {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);

  return toDateKey(date);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
