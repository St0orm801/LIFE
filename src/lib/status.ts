// Derived status + reminder engine. Pure functions — no React, no storage.

import {
  diffDays,
  formatOffsetDays,
  reminderOccurrence,
  todayStr,
} from "./date-utils";
import type { Item, ReminderRule, ViewStatus } from "./types";

export const EXPIRY_TYPES = new Set([
  "expires",
  "best-before",
  "renew-license",
]);

/** How far ahead (days) an item counts as "due soon" when no reminder exists. */
export const DEFAULT_DUE_SOON_WINDOW = 14;

/** Whole reminder offsets in days for an item's rules. */
export function reminderOffsets(rules: ReminderRule[]): number[] {
  return rules
    .filter((r) => r.enabled)
    .map((r) => {
      const mult = r.unit === "week" ? 7 : r.unit === "month" ? 30 : 1;
      return r.offset * mult;
    })
    .sort((a, b) => a - b);
}

/** Earliest (largest) lead time — determines the "due soon" window. */
export function soonWindowDays(item: Item): number {
  const offsets = reminderOffsets(item.reminderRules);
  return offsets.length ? Math.max(...offsets) : DEFAULT_DUE_SOON_WINDOW;
}

export function deriveStatus(item: Item, today: string = todayStr()): ViewStatus {
  if (item.status === "archived") return "archived";
  if (item.status === "completed") return "completed";
  const diff = diffDays(today, item.nextDate);
  if (diff < 0) return EXPIRY_TYPES.has(item.actionType) ? "expired" : "overdue";
  if (diff === 0) return "today";
  if (diff <= soonWindowDays(item)) return "due-soon";
  return "active";
}

export interface StatusMeta {
  label: string;
  tone: "teal" | "gold" | "clay" | "red" | "gray" | "slate";
}

export function statusMeta(status: ViewStatus): StatusMeta {
  switch (status) {
    case "active":
      return { label: "Active", tone: "teal" };
    case "due-soon":
      return { label: "Due soon", tone: "gold" };
    case "today":
      return { label: "Today", tone: "teal" };
    case "overdue":
      return { label: "Overdue", tone: "clay" };
    case "expired":
      return { label: "Expired", tone: "red" };
    case "completed":
      return { label: "Completed", tone: "slate" };
    case "archived":
      return { label: "Archived", tone: "gray" };
  }
}

/** Human label for "what happens on nextDate", e.g. "Expires", "Renews". */
export function actionVerbLabel(actionType: Item["actionType"]): string {
  switch (actionType) {
    case "expires": return "Expires";
    case "renews": return "Renews";
    case "replace": return "Replace";
    case "service": return "Service";
    case "birthday": return "Birthday";
    case "anniversary": return "Anniversary";
    case "best-before": return "Best before";
    case "due": return "Due";
    case "pay": return "Pay";
    case "return": return "Return by";
    case "review": return "Review";
    case "check": return "Check";
    case "renew-license": return "Licence renews";
    case "refill": return "Refill";
    case "custom": return "Next date";
  }
}

export interface ReminderSummary {
  /** All reminder occurrence dates, newest first. */
  occurrences: { date: string; offsetLabel: string }[];
  /** "6 months and 30 days before" */
  human: string;
}

export function reminderSummary(
  rules: ReminderRule[],
  nextDate: string,
): ReminderSummary {
  const offsets = reminderOffsets(rules);
  const occurrences = offsets
    .map((o) => ({
      date: reminderOccurrence(nextDate, o),
      offsetLabel: `${formatOffsetDays(o)} before`,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const human =
    offsets.length === 0
      ? "No reminders"
      : offsets.map((o) => formatOffsetDays(o)).join(" and ") + " before";
  return { occurrences, human };
}

/** Items that need attention today (overdue, expired, due today, due soon). */
export function needsAttention(item: Item, today: string = todayStr()): boolean {
  const s = deriveStatus(item, today);
  return s === "overdue" || s === "expired" || s === "today" || s === "due-soon";
}

export function overdueFirst(a: Item, b: Item): number {
  const sa = deriveStatus(a);
  const sb = deriveStatus(b);
  const rank: Record<ViewStatus, number> = {
    expired: 0, overdue: 1, today: 2, "due-soon": 3, active: 4, completed: 5, archived: 6,
  };
  if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
  return a.nextDate < b.nextDate ? -1 : 1;
}