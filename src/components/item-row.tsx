// Item row — shared across Today / Timeline / Items. Communicates quickly:
// icon, title, what happens, date, remaining, status.

import { ArrowRight } from "@phosphor-icons/react";
import { diffDays, formatDateLong, formatRemainingDays, humanRelative, todayStr } from "../lib/date-utils";
import { actionVerbLabel, deriveStatus } from "../lib/status";
import type { Item } from "../lib/types";
import { CatDot, ItemStatusPill } from "./ui";
import { CATEGORY_BY_ID } from "../lib/presets";

export function ItemRow({ item, onClick }: { item: Item; onClick: () => void }) {
  const today = todayStr();
  const diff = diffDays(today, item.nextDate);
  const status = deriveStatus(item, today);
  const cat = CATEGORY_BY_ID[item.categoryId];

  return (
    <button
      onClick={onClick}
      className="row-btn anim-fade-in"
      aria-label={`${item.title}, ${actionVerbLabel(item.actionType)} ${formatDateLong(item.nextDate)}`}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `color-mix(in srgb, ${cat?.color ?? "#8a8274"} 14%, white)` }}
      >
        <span style={{ color: cat?.color ?? "#8a8274" }} className="text-[1.15rem]">
          <CatDot categoryId={item.categoryId} size={18} />
        </span>
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className="truncate text-[0.95rem] font-bold text-ink">{item.title}</span>
          <ItemStatusPill item={item} />
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[0.82rem] text-ink-2">
          <span className="font-semibold text-ink-2">{actionVerbLabel(item.actionType)}</span>
          <span className="tnum font-semibold">{formatDateLong(item.nextDate)}</span>
          <span className="text-ink-3">
            · {diff === 0 ? "today" : diff === 1 ? "tomorrow" : diff < 0 ? `${-diff}d overdue` : `in ${diff}d`}
          </span>
        </span>
      </span>
      <span className="tnum shrink-0 text-[0.8rem] font-extrabold text-ink-3">{formatRemainingDays(diff)}</span>
      <span className="shrink-0 text-ink-3">
        <ArrowRight size={16} />
      </span>
    </button>
  );
}