// Date utilities — date-ONLY semantics. Everything is a local "YYYY-MM-DD"
// string. We never construct UTC dates from date-only input, so a user picking
// September 14 never sees September 13 (timezone-shift bugs).

import type { DateStr } from "./types";

export const todayStr = (): DateStr => {
  const d = new Date();
  return toDateStr(d);
};

export function toDateStr(d: Date): DateStr {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" into a LOCAL Date at midnight. Never uses Date.UTC. */
export function parseLocal(s: DateStr): Date {
  const [y, m, d] = s.split("-").map((n) => Number(n));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Whole days from epoch, using local calendar — stable across DST. */
function epochDays(d: Date): number {
  return Math.floor(
    (d.setHours(0, 0, 0, 0), d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000,
  );
}

/** Whole days between two date strings (b - a). Timezone-independent. */
export function diffDays(a: DateStr, b: DateStr): number {
  return epochDays(parseLocal(b)) - epochDays(parseLocal(a));
}

export function addDays(s: DateStr, days: number): DateStr {
  const d = parseLocal(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function addMonths(s: DateStr, months: number): DateStr {
  const d = parseLocal(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const max = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, max));
  return toDateStr(d);
}

export function addYears(s: DateStr, years: number): DateStr {
  const [y, m, d] = s.split("-").map(Number);
  return `${y + years}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Next occurrence of a month-day (candidate birthday in year Y, else Y+1…). */
export function nextMonthDay(monthDay: string, from: DateStr = todayStr()): DateStr {
  const [mm, dd] = monthDay.split("-").map(Number);
  const baseY = Number(from.slice(0, 4));
  const candidate = `${baseY}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  if (candidate >= from) return candidate;
  return `${baseY + 1}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export function monthDayOf(s: DateStr): string {
  return s.slice(5);
}

export function isFutureOrToday(s: DateStr): boolean {
  return diffDays(todayStr(), s) >= 0;
}

// ── Formatting ──────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDateLong(s: DateStr): string {
  const [y, m, d] = s.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatDateShort(s: DateStr): string {
  const [, m, d] = s.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

export function formatMonthDay(monthDay: string): string {
  const [m, d] = monthDay.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "2y 9m", "5d", "1y 2m" — compact time-remaining for cards. */
export function formatRemainingDays(days: number): string {
  const abs = Math.abs(days);
  const sign = days < 0 ? "-" : "";
  if (abs >= 365) {
    const y = Math.floor(abs / 365);
    const m = Math.floor((abs % 365) / 30);
    return `${sign}${y}y${m ? ` ${m}m` : ""}`;
  }
  if (abs >= 30) {
    const m = Math.floor(abs / 30);
    const d = abs % 30;
    return `${sign}${m}m${d ? ` ${d}d` : ""}`;
  }
  return `${sign}${abs}d`;
}

/** Human relative label: "in 5 days", "tomorrow", "today", "overdue by 3d". */
export function humanRelative(diff: number): string {
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${diff * -1} days overdue`;
}

/** Reminder offset rendered humanly, e.g. 180 → "6 months", 30 → "30 days". */
export function formatOffsetDays(days: number): string {
  if (days % 365 === 0 && days >= 365) return `${days / 365} year${days > 365 ? "s" : ""}`;
  if (days % 30 === 0 && days >= 30) return `${days / 30} month${days > 30 ? "s" : ""}`;
  if (days % 7 === 0 && days >= 7) return `${days / 7} week${days > 7 ? "s" : ""}`;
  return `${days} day${days > 1 ? "s" : ""}`;
}

/** Reminder occurrence date for an item whose nextDate is `next`. */
export function reminderOccurrence(next: DateStr, offsetDays: number): DateStr {
  return addDays(next, -offsetDays);
}