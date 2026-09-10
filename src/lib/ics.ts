// ICS calendar export — real .ics generation for all active items + reminders.
// Honest capability: the browser downloads the file; native calendar apps can
// subscribe or import it. No fake server-side sync.

import { formatOffsetDays, todayStr } from "./date-utils";
import { reminderOffsets } from "./status";
import type { Item } from "./types";

function icsDate(d: string): string {
  return d.replace(/-/g, "");
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(items: Item[]): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LIFE CLOCK//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:LIFE CLOCK",
  ];
  const active = items.filter((i) => i.status === "active");
  for (const item of active) {
    const summary = `${item.title} (${labelFor(item.actionType)})`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${item.id}@life-clock`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate(item.nextDate)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(addDay(item.nextDate))}`);
    lines.push(`SUMMARY:${escapeIcs(summary)}`);
    if (item.notes) lines.push(`DESCRIPTION:${escapeIcs(item.notes)}`);
    for (const off of reminderOffsets(item.reminderRules)) {
      const trigger = reminderTrigger(item.nextDate, off);
      lines.push(`BEGIN:VALARM`);
      lines.push(`ACTION:DISPLAY`);
      lines.push(`DESCRIPTION:${escapeIcs(summary)}`);
      lines.push(`TRIGGER:-PT${trigger}`);
      lines.push(`END:VALARM`);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function labelFor(t: Item["actionType"]): string {
  switch (t) {
    case "expires": return "expires";
    case "renews": return "renews";
    case "replace": return "replace";
    case "service": return "service";
    case "birthday": return "birthday";
    case "anniversary": return "anniversary";
    case "best-before": return "best before";
    case "due": return "due";
    case "pay": return "pay";
    case "return": return "return by";
    case "review": return "review";
    case "check": return "check";
    case "renew-license": return "licence renews";
    case "refill": return "refill";
    case "custom": return "next date";
  }
}

/** Convert offset days to ISO-8601 duration (e.g. "30D"). */
function reminderTrigger(nextDate: string, offsetDays: number): string {
  const weeks = Math.floor(offsetDays / 7);
  const days = offsetDays % 7;
  if (weeks > 0 && days === 0) return `${weeks}W`;
  return `${offsetDays}D`;
}

function addDay(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(y, m - 1, day + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function downloadIcs(items: Item[]): void {
  const blob = new Blob([buildIcs(items)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `life-clock-${todayStr()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export { formatOffsetDays };