// TODAY — "What deserves my attention?" Overdue, due today, coming soon.

import { useMemo } from "react";
import { CheckCircle, Clock, Hourglass, Sparkle } from "@phosphor-icons/react";
import { diffDays, formatDateLong, humanRelative, todayStr } from "../lib/date-utils";
import { deriveStatus, needsAttention, overdueFirst } from "../lib/status";
import { useApp } from "../lib/store";
import type { Item } from "../lib/types";
import { ItemRow } from "./item-row";
import { EmptyState } from "./ui";
import type { Route } from "./app-shell";
import { isPurchase, purchaseStage, purchaseStageLabels } from '../lib/purchase';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function TodayView({ navigate }: { navigate: (r: Route) => void }) {
  const { items, ready } = useApp();
  const today = todayStr();

  const { overdue, todayList, comingSoon } = useMemo(() => {
    const active = items.filter((i) => i.status === "active");
    const overdue = active.filter((i) => {
      const s = deriveStatus(i, today);
      return s === "overdue" || s === "expired";
    });
    const todayList = active.filter((i) => deriveStatus(i, today) === "today");
    const comingSoon = active.filter((i) => {
      const s = deriveStatus(i, today);
      return s === "due-soon";
    });
    return { overdue: overdue.sort(overdueFirst), todayList, comingSoon: comingSoon.sort(overdueFirst) };
  }, [items, today]);

  const thisWeek = useMemo(
    () => items.filter((i) => i.status === "active" && diffDays(today, i.nextDate) >= 0 && diffDays(today, i.nextDate) <= 7).length,
    [items, today],
  );
  const next30 = useMemo(
    () => items.filter((i) => i.status === "active" && diffDays(today, i.nextDate) >= 8 && diffDays(today, i.nextDate) <= 30).length,
    [items, today],
  );

  const nothingNeeded = overdue.length === 0 && todayList.length === 0 && comingSoon.length === 0;

  const openItem = (id: string) => navigate({ view: "item", id });

  return (
    <div className="anim-fade-up">
      <header className="mb-6">
        <p className="text-[0.8rem] font-bold uppercase tracking-[0.16em] text-ink-3">{greeting()}</p>
        <h1 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-ink">
          {formatDateLong(today)}
        </h1>
      </header>
      {ready && items.some(item => item.id.startsWith('demo-')) && <p className="mb-3 text-xs text-ink-2">Example records are included to show how LIFE works. They are not your purchases or documents. You can archive them from Items.</p>}

      {ready && items.some(item => item.status === 'active' && isPurchase(item) && purchaseStage(item) !== 'kept') && <section className="card p-4 mb-4 space-y-2" aria-labelledby="purchase-decisions"><h2 id="purchase-decisions" className="font-extrabold">Decisions & returns</h2>{items.filter(item => item.status === 'active' && isPurchase(item) && purchaseStage(item) !== 'kept').sort(overdueFirst).map(item => <button key={item.id} className="row-btn w-full" onClick={() => openItem(item.id)}><span className="font-bold">{item.title}</span><span className="block text-sm text-ink-2">{purchaseStageLabels[purchaseStage(item)]} · {item.nextDate}</span></button>)}</section>}

      {!ready ? (
        <div role="status" aria-label="Loading your dates" className="space-y-3"><p className="text-sm text-ink-2">Loading your dates…</p>{[0, 1, 2].map(key => <div key={key} className="card h-20 bg-surface-2" aria-hidden="true" />)}</div>
      ) : nothingNeeded ? (
        <div className="card">
          <EmptyState
            icon={<Sparkle size={32} weight="duotone" />}
            title="Nothing needs your attention"
            hint={items.length === 0 ? "Add the first thing you never want to forget." : "Everything on your clock is calm for now."}
            action={
              <button className="btn btn-primary" onClick={() => navigate({ view: "add" })}>
                Add item
              </button>
            }
          />
        </div>
      ) : (
        <>
          <Section title="Needs attention" subtle />

          {overdue.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => openItem(item.id)} />
          ))}
          {todayList.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => openItem(item.id)} />
          ))}
          {comingSoon.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => openItem(item.id)} />
          ))}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <OverviewTile icon={<Clock size={18} weight="duotone" />} label="This week" value={thisWeek} />
            <OverviewTile icon={<Hourglass size={18} weight="duotone" />} label="Next 30 days" value={next30} />
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, subtle }: { title: string; subtle?: boolean }) {
  return (
    <h2 className={`mb-3 text-[0.82rem] font-bold uppercase tracking-[0.14em] ${subtle ? "text-ink-3" : "text-ink-2"}`}>
      {title}
    </h2>
  );
}

function OverviewTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3.5">
      <div className="text-teal">{icon}</div>
      <div className="min-w-0">
        <div className="tnum text-[1.15rem] font-extrabold leading-none text-ink">{value}</div>
        <div className="mt-0.5 text-[0.75rem] font-semibold text-ink-3">{label}</div>
      </div>
    </div>
  );
}

export { humanRelative, formatDateLong, CheckCircle };
