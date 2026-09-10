// Lifecycle verbs per action type — what pressing the primary button does/means.

import { nextOccurrence } from "./recur";
import { addMonths, todayStr } from "./date-utils";
import type { HistoryType, Item, LifecycleVerb } from "./types";
import type { DateStr } from "./types";

/**
 * Result of applying a lifecycle action.
 * nextDate present → the item continues with a new date (same identity, history
 * records oldDate → newDate). completed → one-shot item is finished.
 */
export interface LifecycleResult {
  nextDate?: DateStr;
  completed?: boolean;
  historyType: HistoryType;
  note?: string;
}

export function verbFor(item: Pick<Item, "actionType" | "repeatRule" | "presetId">): LifecycleVerb {
  const t = item.actionType;
  switch (t) {
    case "expires": return { action: "Renew", historyType: "renewed" };
    case "renews": return { action: "Renewed", historyType: "renewed" };
    case "replace": return { action: "Replaced", historyType: "replaced" };
    case "service": return { action: "Serviced", historyType: "serviced" };
    case "pay": return { action: "Paid", historyType: "paid" };
    case "return": return { action: "Returned", historyType: "returned" };
    case "best-before":
      return {
        action: "Consumed",
        historyType: "consumed",
        secondary: { action: "Discarded", historyType: "discarded" },
      };
    case "due": return { action: "Completed", historyType: "completed" };
    case "check": return { action: "Checked", historyType: "completed" };
    case "review": return { action: "Reviewed", historyType: "completed" };
    case "refill": return { action: "Refilled", historyType: "renewed" };
    case "birthday": return { action: "Celebrated", historyType: "completed" };
    case "anniversary": return { action: "Celebrated", historyType: "completed" };
    case "renew-license": return { action: "Renewed", historyType: "renewed" };
    case "custom": return { action: "Completed", historyType: "completed" };
  }
}

/**
 * Apply a lifecycle action to an item.
 * - Recurring items: compute the next occurrence automatically (furnace filter
 *   → +3 months; subscription → +1 month; birthday → +1 year).
 * - One-shot items: completed = true unless the user supplied their own new date.
 */
export function applyLifecycle(
  item: Pick<Item, "actionType" | "repeatRule" | "nextDate" | "presetId">,
  opts: { newDate?: DateStr } = {},
): LifecycleResult {
  const verb = verbFor(item);
  const done = new Set<HistoryType>(["consumed", "discarded", "completed"]);
  if (opts.newDate) {
    return { nextDate: opts.newDate, historyType: verb.historyType, note: "Manual date" };
  }
  if (done.has(verb.historyType)) {
    return { completed: true, historyType: verb.historyType };
  }
  if (item.repeatRule && item.repeatRule.kind !== "none") {
    return { nextDate: nextOccurrence(item.nextDate, item.repeatRule), historyType: verb.historyType };
  }
  // Non-recurring expiry/renewal: ask for the new date (Renew flow).
  return { nextDate: undefined, historyType: verb.historyType };
}

/** Sensible default for a "new date" field in the Renew flow. */
export function suggestedNewDate(item: Pick<Item, "actionType" | "repeatRule" | "nextDate">): DateStr {
  if (item.repeatRule && item.repeatRule.kind !== "none") {
    return nextOccurrence(item.nextDate, item.repeatRule);
  }
  if (item.actionType === "expires" || item.actionType === "renew-license") {
    return addMonths(item.nextDate, 24); // passports aren't the only doc; user will adjust
  }
  return item.nextDate > todayStr() ? item.nextDate : addMonths(todayStr(), 1);
}