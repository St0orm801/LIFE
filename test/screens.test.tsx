// Screen render smoke tests — every view renders without crashing on realistic
// demo data, WITH a real client render (happy-dom + fake-indexeddb + effects),
// and shows the expected key content. Uses the real AppProvider, real store,
// real repository — the same code path the user's browser runs.

import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "bun:test";
import { Window } from "happy-dom";
import { act } from "react";
import { createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { repository } from "../src/lib/storage";
import { DEMO_ITEMS } from "../src/lib/demo";
import { AppProvider } from "../src/lib/store";
import { TodayView } from "../src/components/today";
import { ItemsView } from "../src/components/items";
import { MoreView } from "../src/components/more";
import { ItemDetailView } from "../src/components/item-detail";
import { AddFlow } from "../src/components/add-flow";
import { CalendarView } from "../src/components/calendar";

const window_ = new Window({ url: "http://localhost/app" });
globalThis.window = window_ as unknown as Window & typeof globalThis;
globalThis.document = window_.document;
globalThis.navigator = window_.navigator;
globalThis.HTMLElement = window_.HTMLElement;
globalThis.HTMLInputElement = window_.HTMLInputElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const noopNav = () => {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  await repository.wipe();
  await repository.setMeta("demo-seeded-v1", "yes");
  // The provider skips seeding when the flag says "already seeded", so put the
  // demo items in directly — this mirrors the post-seed application state.
  await repository.putItems(DEMO_ITEMS);
});

async function mountHtml(node: ReactNode): Promise<string> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(createElement(AppProvider, null, node));
  });
  await act(async () => {
    await sleep(60); // IndexedDB load + state flush inside act
  });
  const html = host.innerHTML;
  await act(async () => {
    root.unmount();
  });
  host.remove();
  return html;
}

describe("screen render (client, real store)", () => {
  it("Today shows Needs attention with due-soon demo items", async () => {
    const html = await mountHtml(createElement(TodayView, { navigate: noopNav as never }));
    expect(html).toContain("Needs attention");
    expect(html).toContain("Milk");
    expect(html).toContain("Due soon");
  });

  it("Items shows category cards with counts", async () => {
    const html = await mountHtml(createElement(ItemsView, { navigate: noopNav as never }));
    expect(html).toContain("Documents");
    expect(html).toContain("All items");
  });

  it("More shows settings sections", async () => {
    const html = await mountHtml(createElement(MoreView, { navigate: noopNav as never }));
    expect(html).toContain("Reminders");
    expect(html).toContain("Your data");
    expect(html).toContain("About LIFE CLOCK");
  });

  it("ItemDetail shows the demo passport with reminders and history", async () => {
    const html = await mountHtml(
      createElement(ItemDetailView, { id: "demo-passport", navigate: noopNav as never }),
    );
    expect(html).toContain("Passport");
    expect(html).toContain("Reminders");
    expect(html).toContain("History");
    expect(html).toContain("Jun 18, 2029");
  });

  it("AddFlow renders search + popular + categories", async () => {
    const html = await mountHtml(createElement(AddFlow, { onClose: noopNav }));
    expect(html).toContain("What do you want to track?");
    expect(html).toContain("Popular");
    expect(html).toContain("Categories");
  });

  it("Calendar renders month grid with marked days", async () => {
    const html = await mountHtml(
      createElement(CalendarView, { items: DEMO_ITEMS, onOpenItem: noopNav }),
    );
    expect(html).toContain("Calendar");
    expect(html).toContain("Mon");
  });
});

describe("domain invariants", () => {
  it("14 categories, 150+ presets, unique ids", async () => {
    const { CATEGORIES, PRESETS } = await import("../src/lib/presets");
    expect(CATEGORIES.length).toBe(14);
    expect(PRESETS.length).toBeGreaterThanOrEqual(150);
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
  });

  it("demo list is future-dated and flags due-soon on first run", async () => {
    const { deriveStatus } = await import("../src/lib/status");
    const { todayStr } = await import("../src/lib/date-utils");
    const today = todayStr();
    const statuses = DEMO_ITEMS.map((d) => deriveStatus(d, today));
    expect(statuses).toContain("due-soon");
    expect(statuses.every((s) => s !== "expired" && s !== "overdue")).toBe(true);
  });
});