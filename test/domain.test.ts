// Domain logic unit tests — date safety, status, recurrence, reminders, search.
// Run: bun test

import { describe, expect, it } from "bun:test";
import {
  addDays,
  addMonths,
  addYears,
  diffDays,
  formatRemainingDays,
  humanRelative,
  nextMonthDay,
  reminderOccurrence,
  todayStr,
} from "../src/lib/date-utils";
import { deriveStatus, reminderOffsets } from "../src/lib/status";
import { searchPresets as searchLib } from "../src/lib/search";
import { nextOccurrence, rolledDate } from "../src/lib/recur";
import { applyLifecycle, verbFor } from "../src/lib/lifecycle";
import { PRESET_BY_ID, PRESETS, CATEGORIES } from "../src/lib/presets";
import type { Item } from "../src/lib/types";

describe("date-utils — date-only safety", () => {
  it("diffDays is timezone-stable across DST", () => {
    // Mar 14 2026 (before DST in many zones) → Mar 15 2026
    expect(diffDays("2026-03-14", "2026-03-15")).toBe(1);
    // DST spring-forward weekend (North America Mar 8 2026)
    expect(diffDays("2026-03-07", "2026-03-08")).toBe(1);
    expect(diffDays("2026-09-14", "2026-09-10")).toBe(-4);
  });

  it("addDays/addMonths/addYears keep calendar correctness", () => {
    expect(addDays("2026-09-10", 5)).toBe("2026-09-15");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-01-31", 2)).toBe("2026-03-31");
    expect(addYears("2026-09-10", 1)).toBe("2027-09-10");
  });

  it("nextMonthDay finds the next occurrence", () => {
    expect(nextMonthDay("04-09", "2026-09-10")).toBe("2027-04-09");
    expect(nextMonthDay("12-01", "2026-09-10")).toBe("2026-12-01");
  });

  it("humanRelative and remaining formatting", () => {
    expect(humanRelative(0)).toBe("today");
    expect(humanRelative(1)).toBe("tomorrow");
    expect(humanRelative(5)).toBe("in 5 days");
    expect(humanRelative(-3)).toBe("3 days overdue");
    expect(formatRemainingDays(1024)).toBe("2y 9m");
    expect(formatRemainingDays(45)).toBe("1m 15d");
  });

  it("todayStr returns a valid YYYY-MM-DD", () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("status engine", () => {
  const base = (over: Partial<Item>): Item => ({
    id: "1",
    title: "Test",
    categoryId: "documents",
    presetId: "passport",
    actionType: "expires",
    nextDate: "2029-06-18",
    repeatRule: null,
    reminderRules: [{ offset: 30, unit: "day", enabled: true }],
    status: "active",
    attachments: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  });

  it("derives expired / overdue / today / due soon / active", () => {
    expect(deriveStatus(base({ nextDate: "2026-09-01" }), "2026-09-10")).toBe("expired");
    expect(deriveStatus(base({ nextDate: "2026-09-01", actionType: "service" }), "2026-09-10")).toBe("overdue");
    expect(deriveStatus(base({ nextDate: "2026-09-10" }), "2026-09-10")).toBe("today");
    expect(deriveStatus(base({ nextDate: "2026-09-20" }), "2026-09-10")).toBe("due-soon");
    expect(deriveStatus(base({ nextDate: "2027-01-01" }), "2026-09-10")).toBe("active");
  });

  it("respects archived and completed", () => {
    expect(deriveStatus(base({ status: "archived" }), "2026-09-10")).toBe("archived");
    expect(deriveStatus(base({ status: "completed" }), "2026-09-10")).toBe("completed");
  });

  it("reminderOffsets converts units to days and sorts", () => {
    const rules = [
      { offset: 2, unit: "week" as const, enabled: true },
      { offset: 6, unit: "month" as const, enabled: true },
      { offset: 15, unit: "day" as const, enabled: true },
    ];
    expect(reminderOffsets(rules)).toEqual([15, 14, 180].sort((a, b) => a - b));
  });

  it("reminderOccurrence derives from nextDate", () => {
    expect(reminderOccurrence("2029-06-18", 180)).toBe("2028-12-20");
  });
});

describe("recurrence + lifecycle", () => {
  it("computes next occurrences", () => {
    expect(nextOccurrence("2026-09-10", { kind: "yearly" })).toBe("2027-09-10");
    expect(nextOccurrence("2026-09-10", { kind: "monthly" })).toBe("2026-10-10");
    expect(nextOccurrence("2026-09-10", { kind: "every-n-months", every: 3 })).toBe("2026-12-10");
  });

  it("rolls yearly items past today", () => {
    expect(rolledDate("2026-04-09", "2026-09-10")).toBe("2027-04-09");
    expect(rolledDate("2027-04-09", "2026-09-10")).toBe("2027-04-09");
  });

  it("furnace filter lifecycle advances by repeat rule", () => {
    const item = {
      actionType: "replace" as const,
      repeatRule: { kind: "every-n-months" as const, every: 3 },
      nextDate: "2026-12-01",
      presetId: "furnace-filter",
    };
    const result = applyLifecycle(item);
    expect(result.nextDate).toBe("2027-03-01");
    expect(result.historyType).toBe("replaced");
  });

  it("one-shot best-before completes the item", () => {
    const item = {
      actionType: "best-before" as const,
      repeatRule: null,
      nextDate: "2026-09-14",
      presetId: "food-item",
    };
    expect(applyLifecycle(item).completed).toBe(true);
    expect(verbFor(item).action).toBe("Consumed");
    expect(verbFor(item).secondary?.action).toBe("Discarded");
  });

  it("non-recurring expiry asks for a new date", () => {
    const result = applyLifecycle({
      actionType: "expires" as const,
      repeatRule: null,
      nextDate: "2026-06-18",
      presetId: "passport",
    });
    expect(result.nextDate).toBeUndefined();
    expect(result.historyType).toBe("renewed");
  });
});

describe("preset library", () => {
  it("has 14 categories and 150+ presets", () => {
    expect(CATEGORIES.length).toBe(14);
    expect(PRESETS.length).toBeGreaterThanOrEqual(150);
  });

  it("every preset id is unique and category exists", () => {
    const ids = new Set(PRESETS.map((p) => p.id));
    expect(ids.size).toBe(PRESETS.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const p of PRESETS) expect(cats.has(p.categoryId)).toBe(true);
  });

  it("key presets exist", () => {
    for (const id of ["passport", "birthday", "furnace-filter", "vehicle-insurance", "food-item"]) {
      expect(PRESET_BY_ID[id]).toBeDefined();
    }
  });

  it("search is tolerant (partial + synonyms)", () => {
    const licence = searchLib("licence");
    expect(licence.some((p) => p.name.toLowerCase().includes("licence") || p.name.toLowerCase().includes("license"))).toBe(true);
    const filter = searchLib("filter");
    expect(filter.map((p) => p.name)).toContain("Furnace Filter");
    const insurance = searchLib("insurance");
    expect(insurance.some((p) => p.name.toLowerCase().includes("insurance"))).toBe(true);
    const bday = searchLib("birthday");
    expect(bday.some((p) => p.id === "birthday")).toBe(true);
  });
});