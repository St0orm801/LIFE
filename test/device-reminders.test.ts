import { describe, expect, it } from "bun:test";
import { planDeviceReminders } from "../src/lib/reminder-plan";
import { DEMO_ITEMS } from "../src/lib/demo";
const item = { ...DEMO_ITEMS[0], nextDate: "2026-12-31", reminderRules: [{ offset: 7, unit: "day" as const, enabled: true }] };
describe("device reminder planning", () => {
  it("schedules the lead time and due date at local 9 AM", () => {
    const plan = planDeviceReminders([item], new Date("2026-12-01T12:00:00"));
    expect(plan).toHaveLength(2);
    expect(plan[0].at.getDate()).toBe(24);
    expect(plan[0].at.getHours()).toBe(9);
    expect(plan[1].at.getDate()).toBe(31);
    expect(plan[0].id).not.toBe(plan[1].id);
  });
  it("excludes archived and past events and caps the iOS queue", () => {
    expect(planDeviceReminders([{ ...item, status: "archived" }])).toHaveLength(0);
    expect(planDeviceReminders([{ ...item, reminderRules: [] }])).toHaveLength(0);
    expect(planDeviceReminders([item], new Date("2027-01-01"))).toHaveLength(0);
    const items = Array.from({ length: 100 }, (_, i) => ({ ...item, id: String(i) }));
    expect(planDeviceReminders(items, new Date("2026-12-01"))).toHaveLength(60);
  });
});
