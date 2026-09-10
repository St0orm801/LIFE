// Recurrence: computing the NEXT occurrence after a lifecycle action or a roll.

import { addDays, addMonths, addYears } from "./date-utils";
import type { DateStr, RepeatRule } from "./types";

/**
 * Compute the next occurrence after `current`.
 * - yearly → same month-day next year
 * - monthly → next month (clamped to month length)
 * - every-n-months → n months later (clamped)
 * - weekly → +7 days (kept for future/consumer presets)
 * - none → current (caller decides)
 */
export function nextOccurrence(current: DateStr, rule: RepeatRule): DateStr {
  switch (rule.kind) {
    case "yearly":
      return addYears(current, 1);
    case "monthly":
      return addMonths(current, 1);
    case "every-n-months":
      return addMonths(current, rule.every && rule.every > 0 ? rule.every : 3);
    case "weekly":
      return addDays(current, 7);
    case "none":
      return current;
  }
}

/** Advance a yearly item (birthday/anniversary) past today if needed. */
export function rolledDate(current: DateStr, today: string): DateStr {
  let d = current;
  let guard = 0;
  while (d < today && guard < 3) {
    d = addYears(d, 1);
    guard += 1;
  }
  return d;
}