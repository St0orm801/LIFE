// Integration tests — real application code, real IndexedDB (fake-indexeddb),
// real lifecycle/store. Covers the 14 spec flows at the data + domain level.

import "fake-indexeddb/auto"; // provides a real global indexedDB for tests

import { describe, expect, it } from "bun:test";
import { IndexedDbRepository } from "../src/lib/storage";
import { buildIcs } from "../src/lib/ics";
import { searchPresets as searchLib } from "../src/lib/search";
import { searchItems } from "../src/lib/search";
import { PRESET_BY_ID } from "../src/lib/presets";
import { DEMO_ITEMS } from "../src/lib/demo";
import type { Item } from "../src/lib/types";

async function freshRepo(): Promise<IndexedDbRepository> {
  const repo = new IndexedDbRepository();
  await repo.wipe();
  return repo;
}

describe("IndexedDB repository — real persistence", () => {
  it("persists items across repository instances (session survival)", async () => {
    const r1 = await freshRepo();
    const item: Item = {
      id: "it-1",
      title: "Passport",
      categoryId: "documents",
      presetId: "passport",
      actionType: "expires",
      nextDate: "2029-06-18",
      repeatRule: null,
      reminderRules: [{ offset: 180, unit: "day", enabled: true }],
      status: "active",
      attachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await r1.putItem(item);
    await r1.setMeta("seeded", "yes");

    // Simulates a full app reload: brand-new repository on the same DB.
    const r2 = new IndexedDbRepository();
    const all = await r2.getAllItems();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("Passport");
    expect(await r2.getMeta("seeded")).toBe("yes");
  });

  it("stores and returns attachment blobs", async () => {
    const repo = await freshRepo();
    const blob = new Blob(["fake-image-bytes"], { type: "image/png" });
    await repo.putAttachment({ id: "att-1", blob });
    const map = await repo.getAllBlobMap();
    expect(map.get("att-1")?.size).toBe("fake-image-bytes".length);
  });

  it("cascades deletion: item + history + attachments gone", async () => {
    const repo = await freshRepo();
    const item: Item = {
      id: "it-x",
      title: "Warranty",
      categoryId: "warranty",
      presetId: "tv-warranty",
      actionType: "expires",
      nextDate: "2028-08-08",
      repeatRule: null,
      reminderRules: [],
      status: "active",
      attachments: [{ id: "att-9", kind: "photo", filename: "receipt.png", mime: "image/png", size: 10, createdAt: 0 }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await repo.putItem(item);
    await repo.putAttachment({ id: "att-9", blob: new Blob(["x"]) });
    await repo.putHistory({ id: "h-1", itemId: "it-x", type: "created", date: Date.now() });
    await repo.deleteItem("it-x");
    expect(await repo.getAllItems()).toHaveLength(0);
    expect(await repo.getHistory("it-x")).toHaveLength(0);
    expect((await repo.getAllBlobMap()).size).toBe(0);
  });

  it("export → wipe → import round-trip restores everything", async () => {
    const repo = await freshRepo();
    const item: Item = {
      id: "it-y",
      title: "Car Insurance",
      categoryId: "vehicle",
      presetId: "vehicle-insurance",
      actionType: "renews",
      nextDate: "2027-01-15",
      repeatRule: { kind: "yearly" },
      reminderRules: [{ offset: 30, unit: "day", enabled: true }],
      status: "active",
      attachments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await repo.putItem(item);
    await repo.putAttachment({ id: "att-2", blob: new Blob(["data"]) });
    const backup = await repo.exportAll();
    expect(backup.items).toHaveLength(1);

    await repo.wipe();
    expect(await repo.getAllItems()).toHaveLength(0);

    await repo.importAll(backup);
    const restored = await repo.getAllItems();
    expect(restored).toHaveLength(1);
    expect(restored[0].title).toBe("Car Insurance");
    expect((await repo.getAllBlobMap()).size).toBe(1);
  });

  it("demo data is synthetic and well-formed", () => {
    expect(DEMO_ITEMS.length).toBe(7);
    for (const d of DEMO_ITEMS) {
      expect(d.nextDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d.title.length).toBeGreaterThan(0);
    }
  });
});

describe("ICS export", () => {
  it("produces a valid calendar file with events and reminders", async () => {
    const repo = await freshRepo();
    await repo.putItems(DEMO_ITEMS);
    const items = await repo.getAllItems();
    const ics = buildIcs(items);

    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    // Active demo items all become VEVENTs (7 demo, all active)
    const eventCount = ics.split("BEGIN:VEVENT").length - 1;
    expect(eventCount).toBe(7);
    // Passport's 180-day reminder becomes a VALARM
    const passportEvent = ics.slice(ics.indexOf("UID:demo-passport"), ics.indexOf("END:VEVENT", ics.indexOf("UID:demo-passport")));
    expect(passportEvent).toContain("TRIGGER:-P180D");
    // No unescaped line breaks kill the format
    expect(ics).not.toContain("undefined");
  });
});

describe("Search", () => {
  it("preset search: aliases, partials, synonyms", () => {
    expect(searchLib("passport")[0]?.id).toBe("passport");
    const filter = searchLib("filter");
    expect(filter.map((p) => p.id)).toContain("furnace-filter");
    expect(filter.map((p) => p.id)).toContain("water-filter");
    const insurance = searchLib("insurance");
    expect(insurance.some((p) => p.categoryId === "vehicle" && p.name.includes("Insurance"))).toBe(true);
    const licence = searchLib("licence");
    expect(licence.some((p) => p.id === "driver-licence")).toBe(true);
    const bday = searchLib("birthday");
    expect(bday.some((p) => p.id === "birthday")).toBe(true);
  });

  it("item search respects title, preset and category", () => {
    const items = [
      { title: "Samsung TV Warranty", categoryId: "warranty", presetId: "tv-warranty" },
      { title: "Milk", categoryId: "food", presetId: "food-item" },
      { title: "Passport", categoryId: "documents", presetId: "passport" },
    ];
    expect(searchItems(items, "tv", PRESET_BY_ID).map((i) => i.title)).toEqual(["Samsung TV Warranty"]);
    expect(searchItems(items, "milk", PRESET_BY_ID).map((i) => i.title)).toEqual(["Milk"]);
    expect(searchItems(items, "documents", PRESET_BY_ID).length).toBe(1);
    expect(searchItems(items, "zzz", PRESET_BY_ID)).toHaveLength(0);
  });
});

describe("Notifications capability (honest)", () => {
  it("reports unsupported when Notification API is absent", async () => {
    // In the test environment there is no Notification constructor.
    const { notificationsSupported, permissionState } = await import("../src/lib/notify");
    expect(notificationsSupported()).toBe(false);
    expect(permissionState()).toBe("unsupported");
  });
});

describe("Status derivation on realistic demo data (today = 2026-09-10)", () => {
  it("demo items derive expected statuses", async () => {
    const { deriveStatus } = await import("../src/lib/status");
    const byId = new Map(DEMO_ITEMS.map((d) => [d.id, d]));
    // Milk best-before Sep 14 → due soon (3 days out); Netflix Oct 4 → active
    const { addDays } = await import("../src/lib/date-utils");
    const milk = byId.get("demo-milk")!;
    expect(deriveStatus(milk, addDays(milk.nextDate, -3))).toBe("due-soon");
    expect(deriveStatus(byId.get("demo-netflix")!, "2026-09-10")).toBe("active");
    expect(deriveStatus(byId.get("demo-passport")!, "2026-09-10")).toBe("active");
  });
});
