import { addDays } from "./date-utils";
import { reminderOffsets } from "./status";
import type { Item } from "./types";
import { purchaseDeadlines } from './purchase';

export function planDeviceReminders(items: Item[], now = new Date(), time = '09:00') {
  const reminderTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '09:00';
  const events: Array<{ id: number; title: string; body: string; at: Date; itemId: string }> = [];
  const used = new Set<number>();
  for (const item of items) {
    if (item.status !== "active") continue;
    const offsets = reminderOffsets(item.reminderRules);
    if (!offsets.length) continue;
    for (const deadline of purchaseDeadlines(item)) for (const offset of new Set([...offsets, 0])) {
      if (!Number.isFinite(offset) || offset < 0) continue;
      const at = new Date(`${addDays(deadline.date, -offset)}T${reminderTime}:00`);
      if (!Number.isFinite(at.getTime()) || at <= now) continue;
      const key = `${item.id}:${deadline.key}:${deadline.date}:${offset}`;
      let id = 1;
      for (const char of key) id = (Math.imul(id, 31) + char.charCodeAt(0)) & 0x7fffffff;
      while (!id || used.has(id)) id = (id + 1) & 0x7fffffff;
      used.add(id);
      events.push({ id, title: item.title, body: `${deadline.label} · ${offset ? `${offset} days until ${deadline.date}` : `Today · ${deadline.date}`}`, at, itemId: item.id });
    }
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 60);
}
