import { describe, expect, it } from "bun:test";
import { buildIcs } from "../src/lib/ics";
import type { Item } from "../src/lib/types";

const item: Item = { id: "test", title: "Passport", categoryId: "documents", presetId: "passport", actionType: "expires", nextDate: "2026-12-31", repeatRule: null, reminderRules: [{ offset: 30, unit: "day", enabled: true }, { offset: 7, unit: "day", enabled: true }], status: "active", attachments: [], createdAt: 0, updatedAt: 0 };
describe("calendar export", () => {
  it("uses valid day and week alarm durations and includes category and timestamp", () => {
    const ics = buildIcs([item]);
    expect(ics).toContain("TRIGGER:-P30D");
    expect(ics).toContain("TRIGGER:-P1W");
    expect(ics).not.toContain("TRIGGER:-PT30D");
    expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    expect(ics).toContain("CATEGORIES:");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
  });
  it("exports only active items", () => {
    expect(buildIcs([{ ...item, status: "archived" }])).not.toContain("BEGIN:VEVENT");
  });
});
