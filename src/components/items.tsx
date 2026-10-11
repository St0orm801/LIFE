// ITEMS — "What am I tracking?" Category cards with counts, All Items,
// search, Active / Completed / Archived tabs, category browsing.

import { useMemo, useState } from "react";
import { MagnifyingGlass, SquaresFour } from "@phosphor-icons/react";
import { useApp } from "../lib/store";
import { CATEGORIES, CATEGORY_BY_ID, PRESET_BY_ID } from "../lib/presets";
import { searchItems } from "../lib/search";
import { needsAttention } from "../lib/status";
import { diffDays, todayStr } from "../lib/date-utils";
import type { Item } from "../lib/types";
import { ItemRow } from "./item-row";
import { CatDot, EmptyState } from "./ui";
import type { Route } from "./app-shell";

type Tab = "active" | "completed" | "archived";

export function ItemsView({ navigate }: { navigate: (r: Route) => void }) {
  const { items, ready } = useApp();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [quick, setQuick] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>("__all__");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      if (it.status !== "active") continue;
      m.set(it.categoryId, (m.get(it.categoryId) ?? 0) + 1);
    }
    return m;
  }, [items]);

  const visible = useMemo(() => {
    let list: Item[] = items.filter((i) => i.status === tab);
    // "__all__" is the "All items" sentinel — never filter by it.
    if (categoryFilter && categoryFilter !== "__all__") {
      list = list.filter((i) => i.categoryId === categoryFilter);
    }
    if (quick === "attention") list = list.filter(i => needsAttention(i));
    if (quick === "30") list = list.filter(i => { const d = diffDays(todayStr(), i.nextDate); return d >= 0 && d <= 30; });
    if (query.trim()) list = searchItems(list, query, PRESET_BY_ID);
    return [...list].sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1));
  }, [items, tab, categoryFilter, query, quick]);

  return (
    <div className="anim-fade-up">
      <header className="mb-4">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-ink">Items</h1>
      </header>

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
          <MagnifyingGlass size={18} />
        </span>
        <input
          className="input pl-10"
          placeholder="Search items"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search items"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Item status">
        {(["active", "completed", "archived"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`chip capitalize ${tab === t ? "chip-active" : ""}`}
            onClick={() => {
              setTab(t);
              setCategoryFilter("__all__");
              setQuick("all");
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Quick filters">{[{ id: "all", name: "All items" }, { id: "attention", name: "Needs attention" }, { id: "30", name: "Next 30 days" }, { id: "documents", name: "Documents" }, { id: "food", name: "Food" }, { id: "home", name: "Home" }, { id: "vehicle", name: "Vehicles" }].map(f => <button key={f.id} className="chip" aria-pressed={quick === f.id} onClick={() => { setQuick(f.id); setCategoryFilter(["all", "attention", "30"].includes(f.id) ? "__all__" : f.id); }}>{f.name}</button>)}<button className="chip" aria-pressed={categoryFilter === null} onClick={() => { setQuick("categories"); setCategoryFilter(null); }}>Categories</button></div>
      {!ready ? (
        <p className="py-10 text-center text-sm text-ink-3">Loading…</p>
      ) : tab === "active" && !query && !categoryFilter ? (
        <>
          {/* Category cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((c) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => { setCategoryFilter(c.id); setQuick(c.id); }}
                  className="card flex flex-col items-start gap-2.5 p-4 text-left transition-transform active:scale-[0.98]"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: `color-mix(in srgb, ${c.color} 15%, white)` }}
                  >
                    <CatDot categoryId={c.id} size={18} />
                  </span>
                  <span className="w-full">
                    <span className="block truncate text-[0.9rem] font-bold text-ink">{c.shortName}</span>
                    <span className="tnum block text-[0.78rem] font-semibold text-ink-3">
                      {n} {n === 1 ? "item" : "items"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* All items */}
          <button
            className="btn btn-secondary mt-4 btn-block"
            onClick={() => setCategoryFilter("__all__")}
          >
            All items
          </button>
          {categoryFilter === "__all__" ? null : null}
          {visible.length === 0 ? (
            <div className="card mt-4">
              <EmptyState
                icon={<SquaresFour size={30} weight="duotone" />}
                title="Start with something you never want to forget"
                hint="A passport, a warranty, a birthday. Two taps and it is tracked."
                action={
                  <button className="btn btn-primary" onClick={() => navigate({ view: "add" })}>
                    Add item
                  </button>
                }
              />
            </div>
          ) : null}
        </>
      ) : null}

      {/* List (including category-browse and search views) */}
      {ready && (tab !== "active" || query || categoryFilter) ? (
        visible.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Nothing here"
              hint="Try a different search or status tab."
            />
          </div>
        ) : (
          <>
            {categoryFilter && categoryFilter !== "__all__" ? (
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[0.95rem] font-extrabold text-ink">
                  {CATEGORY_BY_ID[categoryFilter]?.name}
                </h2>
                <button className="btn btn-ghost btn-sm" onClick={() => { setCategoryFilter("__all__"); setQuick("all"); }}>
                  Clear
                </button>
              </div>
            ) : null}
            <div className="card-flat divide-y divide-line px-1.5 py-1">
              {visible.map((it) => (
                <ItemRow key={it.id} item={it} onClick={() => navigate({ view: "item", id: it.id })} />
              ))}
            </div>
          </>
        )
      ) : null}
    </div>
  );
}
