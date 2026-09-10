// TIMELINE — "What happens next?" Grouped: Today, Tomorrow, This week,
// Later this month, Next month, Later. Category filter chips, All always first.

import { useMemo, useState } from "react";
import { ChartLineUp } from "@phosphor-icons/react";
import { diffDays, formatDateLong, todayStr } from "../lib/date-utils";
import { deriveStatus } from "../lib/status";
import { useApp } from "../lib/store";
import { CATEGORIES } from "../lib/presets";
import type { Item } from "../lib/types";
import { ItemRow } from "./item-row";
import { CalendarView } from "./calendar";
import { EmptyState } from "./ui";
import type { Route } from "./app-shell";

type Filter = "all" | string;

interface Group {
  key: string;
  label: string;
  items: Item[];
}

function groupItems(items: Item[], today: string): Group[] {
  const groups: Group[] = [
    { key: "today", label: "Today", items: [] },
    { key: "tomorrow", label: "Tomorrow", items: [] },
    { key: "week", label: "This week", items: [] },
    { key: "month", label: "Later this month", items: [] },
    { key: "next-month", label: "Next month", items: [] },
    { key: "later", label: "Later", items: [] },
  ];
  const byKey = new Map(groups.map((g) => [g.key, g]));

  const thisMonthEnd = `${today.slice(0, 8)}01`;
  const sameMonthNext = (d: string) => d.slice(0, 7) === today.slice(0, 7);

  for (const it of items) {
    if (it.status !== "active") continue;
    const diff = diffDays(today, it.nextDate);
    let key: string;
    if (diff < 0) key = "today"; // overdue lands first as "Today"
    else if (diff === 0) key = "today";
    else if (diff === 1) key = "tomorrow";
    else if (diff <= 7) key = "week";
    else if (sameMonthNext(it.nextDate)) key = "month";
    else if (it.nextDate.slice(0, 7) === addMonthsStr(today)) key = "next-month";
    else key = "later";
    byKey.get(key)!.items.push(it);
  }
  return groups.filter((g) => g.items.length > 0);
}

function addMonthsStr(s: string): string {
  const [y, m] = s.split("-").map(Number);
  const nd = new Date(y, m - 1 + 1, 1);
  return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`;
}

export function TimelineView({
  mode,
  setMode,
  navigate,
}: {
  mode: "timeline" | "calendar";
  setMode: (m: "timeline" | "calendar") => void;
  navigate: (r: Route) => void;
}) {
  const { items, ready } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const today = todayStr();

  const filtered = useMemo(
    () => items.filter((i) => filter === "all" || i.categoryId === filter),
    [items, filter],
  );

  // Hooks must run unconditionally — computing counts before the calendar
  // branch keeps the hook order stable across mode switches (a conditional
  // hook after an early return crashes React with error #300).
  const counts = useCategoryCounts(filtered);

  if (mode === "calendar") {
    return (
      <CalendarView
        items={items}
        onOpenItem={(id) => navigate({ view: "item", id })}
        header={
          <ModeSwitch mode={mode} setMode={setMode} />
        }
      />
    );
  }

  const groups = groupItems(filtered, today);

  return (
    <div className="anim-fade-up">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-ink">Timeline</h1>
        <ModeSwitch mode={mode} setMode={setMode} />
      </header>

      {/* Category filter chips */}
      <div className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          className={`chip ${filter === "all" ? "chip-active" : ""}`}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {CATEGORIES.filter((c) => c.major || counts.get(c.id)).map((c) => (
          <button
            key={c.id}
            className={`chip ${filter === c.id ? "chip-active" : ""}`}
            aria-pressed={filter === c.id}
            onClick={() => setFilter(filter === c.id ? "all" : c.id)}
          >
            {c.shortName}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="py-10 text-center text-sm text-ink-3">Loading your timeline…</p>
      ) : groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ChartLineUp size={34} weight="duotone" />}
            title="Your timeline is clear"
            hint={
              filter !== "all"
                ? "No items in this category. Choose All to see everything."
                : "Add something you never want to forget and it will appear here."
            }
          />
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="mb-6">
            <h2 className="mb-2 text-[0.8rem] font-bold uppercase tracking-[0.14em] text-ink-3">
              {g.label}
            </h2>
            <div className="card-flat divide-y divide-line px-1.5 py-1">
              {[...g.items]
                .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1))
                .map((item) => (
                  <ItemRow key={item.id} item={item} onClick={() => navigate({ view: "item", id: item.id })} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ModeSwitch({ mode, setMode }: { mode: "timeline" | "calendar"; setMode: (m: "timeline" | "calendar") => void }) {
  return (
    <div className="flex rounded-full border border-line bg-surface p-0.5">
      {(["timeline", "calendar"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`rounded-full px-3.5 py-1.5 text-[0.8rem] font-bold capitalize transition-colors ${
            mode === m ? "bg-teal text-white" : "text-ink-2"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function useCategoryCounts(items: Item[]): Map<string, number> {
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      if (it.status !== "active") continue;
      m.set(it.categoryId, (m.get(it.categoryId) ?? 0) + 1);
    }
    return m;
  }, [items]);
}

export { formatDateLong, deriveStatus };