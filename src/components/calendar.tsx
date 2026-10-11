// CALENDAR — month view inside Timeline. Dates with items show category
// indicators; tapping a date lists that date's items in a bottom sheet.

import { useMemo, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { diffDays, todayStr, toDateStr } from "../lib/date-utils";
import { actionVerbLabel, deriveStatus } from "../lib/status";
import { CATEGORY_BY_ID } from "../lib/presets";
import type { Item } from "../lib/types";
import { CatDot } from "./ui";
import { isPurchase, purchaseDeadlines } from '../lib/purchase';

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthGrid(year: number, month: number): Array<{ date: string; inMonth: boolean }> {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string; inMonth: boolean }> = [];
  for (let i = 0; i < mondayOffset; i++) {
    const d = new Date(year, month, -mondayOffset + i + 1);
    cells.push({ date: toDateStr(d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const d = new Date(Number(last.date.slice(0, 4)), Number(last.date.slice(5, 7)) - 1, Number(last.date.slice(8)) + 1);
    cells.push({ date: toDateStr(d), inMonth: false });
  }
  return cells;
}

export function CalendarView({
  items,
  onOpenItem,
  header,
  filters,
}: {
  items: Item[];
  onOpenItem: (id: string) => void;
  header?: React.ReactNode;
  filters?: React.ReactNode;
}) {
  const today = todayStr();
  const [cursor, setCursor] = useState(() => new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1));
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) {
      if (it.status !== "active") continue;
      for (const deadline of purchaseDeadlines(it)) {
        const list = m.get(deadline.date) ?? [];
        list.push(isPurchase(it) ? { ...it, title: `${it.title} · ${deadline.label}`, nextDate: deadline.date } : it);
        m.set(deadline.date, list);
      }
    }
    return m;
  }, [items]);

  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const selectedItems = selected ? (byDate.get(selected) ?? []) : [];
  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="anim-fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-ink">Calendar</h1>
        {header}
      </div>

      {filters}
      <div className="card-flat p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            className="btn btn-ghost btn-sm"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <CaretLeft size={16} />
          </button>
          <span className="text-[0.95rem] font-extrabold text-ink">{monthLabel}</span>
          <button
            className="btn btn-ghost btn-sm"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <CaretRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-[0.68rem] font-bold uppercase tracking-wide text-ink-3">
              {d}
            </div>
          ))}
          {cells.map((cell) => {
            const dateItems = byDate.get(cell.date);
            const isToday = cell.date === today;
            const isSelected = cell.date === selected;
            return (
              <button
                key={cell.date}
                onClick={() => setSelected(isSelected ? null : cell.date)}
                aria-label={`${cell.date}${dateItems ? `, ${dateItems.length} items` : ""}`}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-[0.84rem] font-semibold transition-colors ${
                  !cell.inMonth ? "text-ink-3/50" : isSelected ? "bg-teal text-white" : isToday ? "bg-teal-tint text-teal-deep" : "text-ink hover:bg-surface-2"
                }`}
              >
                <span className="tnum">{Number(cell.date.slice(8))}</span>
                {dateItems && dateItems.length > 0 ? (
                  <span className="mt-0.5 flex max-w-full gap-0.5 overflow-hidden">
                    {dateItems.slice(0, 3).map((it) => (
                      <CatDot key={it.id} categoryId={it.categoryId} size={5} />
                    ))}
                    {dateItems.length > 3 ? <span className="text-[0.55rem] font-bold">+{dateItems.length - 3}</span> : null}
                  </span>
                ) : (
                  <span className="mt-0.5 h-[6px]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected-day sheet */}
      {selected ? (
        <div className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl px-5 pb-8 pt-0 safe-bottom md:left-auto md:right-4 md:max-w-md md:rounded-3xl md:shadow-pop">
          <div className="sheet-handle" />
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.05rem] font-extrabold text-ink">
              {new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          {selectedItems.length === 0 ? (
            <p className="pb-4 text-sm text-ink-3">Nothing scheduled on this date.</p>
          ) : (
            <ul className="divide-y divide-line">
              {selectedItems
                .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1))
                .map((it) => (
                  <li key={it.id}>
                    <button className="row-btn" onClick={() => onOpenItem(it.id)}>
                      <span style={{ color: CATEGORY_BY_ID[it.categoryId]?.color }}>
                        <CatDot categoryId={it.categoryId} size={12} />
                      </span>
                      <span className="flex-1 text-left">
                        <span className="block text-[0.92rem] font-bold text-ink">{it.title}</span>
                        <span className="block text-[0.78rem] text-ink-2">{actionVerbLabel(it.actionType)}</span>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { diffDays, toDateStr };
