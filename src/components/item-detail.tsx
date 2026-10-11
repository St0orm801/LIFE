// ITEM DETAIL — next date, time remaining, reminders, attachments, notes,
// contextual lifecycle actions, history. First viewport stays clean.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Camera,
  CaretDown,
  FilePdf,
  NotePencil,
  Paperclip,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import {
  diffDays,
  formatDateLong,
  formatOffsetDays,
  formatRemainingDays,
  reminderOccurrence,
  todayStr,
} from "../lib/date-utils";
import { actionVerbLabel, deriveStatus, reminderOffsets, statusMeta } from "../lib/status";
import { useApp } from "../lib/store";
import { PRESET_BY_ID } from "../lib/presets";
import { formatHistoryEvent } from "../lib/store";
import { applyLifecycle, verbFor, suggestedNewDate } from "../lib/lifecycle";
import type { HistoryEvent, Item } from "../lib/types";
import { CATEGORY_BY_ID } from "../lib/presets";
import { CatDot } from "./ui";
import type { Route } from "./app-shell";
import { isPurchase } from '../lib/purchase';
import { PurchaseActions } from './purchase-flow';

function Avatar({ item }: { item: Item }) {
  const color = CATEGORY_BY_ID[item.categoryId]?.color ?? "#8a8274";
  return (
    <span
      aria-hidden
      className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl"
      style={{ background: `color-mix(in srgb, ${color} 16%, white)`, color, width: 52, height: 52 }}
    >
      <CatDot categoryId={item.categoryId} size={24} />
    </span>
  );
}

export function ItemDetailView({
  id,
  navigate,
}: {
  id: string;
  navigate: (r: Route) => void;
}) {
  const { items, ready, getItem, lifecycle, archiveItem, restoreItem, deleteItem, setNotes, attachFiles, removeAttachment, loadBlob, historyFor } = useApp();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewDate, setRenewDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attachments, setAttachments] = useState<Map<string, Blob>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const item = getItem(id);
  const today = todayStr();
  const preset = item ? PRESET_BY_ID[item.presetId] : undefined;
  const verb = item ? verbFor(item) : undefined;

  useEffect(() => {
    if (!item) return;
    setNoteDraft(item.notes ?? "");
    void historyFor(item.id).then((h) => setHistory([...h].sort((a, b) => b.date - a.date)));
    const m = new Map<string, Blob>();
    item.attachments.forEach((a) => {
      void loadBlob(a.id).then((b) => {
        if (b) {
          setAttachments((prev) => {
            const next = new Map(prev);
            next.set(a.id, b);
            return next;
          });
        }
      });
    });
    void m;
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = item ? deriveStatus(item, today) : "archived";
  const statusLabel = item ? statusMeta(status).label : "";

  const onLifecycle = useCallback(async () => {
    if (!item) return;
    // Preview the action WITHOUT persisting: if the lifecycle needs a manual
    // new date (non-recurring renewals like passports), open the Renew panel
    // instead of mutating state.
    const preview = applyLifecycle(item);
    if (!preview.completed && !preview.nextDate) {
      setRenewOpen(true);
      setHistory(await historyFor(item.id));
      return;
    }
    await lifecycle(item.id);
    setRenewOpen(false);
    setRenewDate("");
    setHistory(await historyFor(item.id));
  }, [item, lifecycle, historyFor]);

  if (!ready) return <p className="py-10 text-center text-sm text-ink-3">Loading…</p>;
  if (!item) {
    return (
      <div className="card p-6">
        <p className="text-center text-sm text-ink-3">This item no longer exists.</p>
        <button className="btn btn-secondary mt-4 btn-block" onClick={() => navigate({ view: "items" })}>
          Back to items
        </button>
      </div>
    );
  }

  const diff = diffDays(today, item.nextDate);
  const actions = preset?.lifecycle ?? (verb ? { action: verb.action, historyType: "completed" as const } : undefined);

  return (
    <div className="anim-fade-up">
      <button
        className="mb-4 flex items-center gap-1.5 text-[0.85rem] font-bold text-ink-2 transition-colors hover:text-ink"
        onClick={() => navigate({ view: "items" })}
      >
        <ArrowLeft size={17} weight="bold" />
        Items
      </button>

      {isPurchase(item) && <PurchaseActions item={item} onChanged={async () => setHistory((await historyFor(item.id)).sort((a, b) => b.date - a.date))} />}
      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="p-5 pb-2">
          <div className="flex items-start gap-3.5">
            <Avatar item={item} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[1.25rem] font-extrabold tracking-tight text-ink">{item.title}</h1>
              </div>
              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide pill-${statusTone(status)}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3">
          <div className="flex items-end justify-between rounded-2xl surface-2 px-4 py-3.5">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                {actionVerbLabel(item.actionType)}
              </p>
              <p className="tnum mt-0.5 text-[1.35rem] font-extrabold leading-tight text-ink">
                {formatDateLong(item.nextDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink-3">Time remaining</p>
              <p className="tnum mt-0.5 text-[1.05rem] font-extrabold text-ink">
                {diff < 0 ? `${-diff}d overdue` : formatRemainingDays(diff)}
              </p>
            </div>
          </div>

          {/* Lifecycle action */}
          {item.status === "active" && !isPurchase(item) ? (
            <div className="mt-4">
              <button className="btn btn-primary btn-block btn-lg" onClick={onLifecycle}>
                {actions?.action ?? verb?.action ?? "Done"}
              </button>
              {actions?.secondary ? (
                <button
                  className="btn btn-secondary btn-block mt-2"
                  onClick={() => void lifecycle(item.id)}
                >
                  {actions.secondary.action}
                </button>
              ) : null}
              {renewOpen ? (
                <RenewPanel
                  suggested={suggestedNewDate(item)}
                  value={renewDate}
                  onChange={setRenewDate}
                  onCancel={() => setRenewOpen(false)}
                  onContinue={() => {
                    if (!renewDate) return;
                    void (async () => {
                      await lifecycle(item.id, { newDate: renewDate });
                      setRenewOpen(false);
                      setRenewDate("");
                      setHistory(await historyFor(item.id));
                    })();
                  }}
                />
              ) : null}
            </div>
          ) : item.status === 'archived' ? (
            <div className="mt-4 flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => void restoreItem(item.id)}>
                Restore
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {!isPurchase(item) && <button className="btn btn-ghost btn-sm" onClick={() => setRenewOpen((v) => !v)}>
              <NotePencil size={15} />
              Edit date
            </button>}
            <button className="btn btn-ghost btn-sm" onClick={() => void archiveItem(item.id)}>
              <Archive size={15} />
              {item.status === "archived" ? "Unarchive" : "Archive"}
            </button>
            {item.status === "active" ? (
              <button className="btn btn-ghost btn-sm text-clay" onClick={() => setConfirmDelete(true)}>
                <Trash size={15} />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reminders */}
      <section className="card mt-4 p-5">
        <h2 className="mb-3 text-[0.85rem] font-extrabold text-ink">Reminders</h2>
        <ul className="space-y-2">
          {reminderOffsets(item.reminderRules).map((off) => (
            <li key={off} className="flex items-center justify-between rounded-xl surface-2 px-3.5 py-2.5">
              <span className="text-[0.88rem] font-semibold text-ink-2">{formatOffsetDays(off)} before</span>
              <span className="tnum text-[0.82rem] font-semibold text-ink-3">
                {formatDateLong(reminderOccurrence(item.nextDate, off))}
              </span>
            </li>
          ))}
          {reminderOffsets(item.reminderRules).length === 0 ? (
            <li className="text-[0.85rem] text-ink-3">No reminders set.</li>
          ) : null}
        </ul>
        {item.amount != null ? (
          <p className="mt-3 text-[0.82rem] font-semibold text-ink-3">
            Amount: {formatMoney(item.amount)}
          </p>
        ) : null}
      </section>

      {/* Notes */}
      <section className="card mt-4 p-5">
        <h2 className="mb-2 text-[0.85rem] font-extrabold text-ink">Notes</h2>
        <textarea
          className="input min-h-[76px] resize-y"
          placeholder="Optional note, e.g. 'Renew online'"
          value={noteDraft ?? ""}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if (noteDraft != null) void setNotes(item.id, noteDraft);
          }}
        />
      </section>

      {/* Attachments */}
      <section className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[0.85rem] font-extrabold text-ink">Attachments</h2>
          <div className="flex gap-1.5">
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              <Paperclip size={15} />
              File
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              <Camera size={15} />
              Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.pdf"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length === 0) return;
                const kind = files.every((f) => f.type.startsWith("image/")) ? "photo" : "file";
                await attachFiles(item.id, files, kind);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {item.attachments.length === 0 ? (
          <p className="text-[0.85rem] text-ink-3">No photos or files yet. Receipts, warranty cards, passports — keep them here.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {item.attachments.map((a) => {
              const blob = attachments.get(a.id);
              const url = blob ? URL.createObjectURL(blob) : null;
              return (
                <li key={a.id} className="group relative">
                  {a.kind === "photo" && url ? (
                    <img
                      src={url}
                      alt={a.filename}
                      className="h-24 w-full rounded-xl border border-line object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <a
                      href={url ?? "#"}
                      download={a.filename}
                      className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-line bg-surface-2 px-2 text-center"
                    >
                      <span className={a.mime === "application/pdf" ? "text-clay" : "text-ink-3"}>
                        <FilePdf size={22} />
                      </span>
                      <span className="line-clamp-2 text-[0.65rem] font-semibold text-ink-2">{a.filename}</span>
                    </a>
                  )}
                  {url ? (
                    <a
                      href={url}
                      download={a.filename}
                      className="absolute inset-0 rounded-xl"
                      aria-label={`Open ${a.filename}`}
                    />
                  ) : null}
                  <button
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove ${a.filename}`}
                    onClick={() => void removeAttachment(item.id, a.id)}
                  >
                    <Trash size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* History */}
      <section className="card mt-4 p-5">
        <h2 className="mb-3 text-[0.85rem] font-extrabold text-ink">History</h2>
        {history.length === 0 ? (
          <p className="text-[0.85rem] text-ink-3">No changes yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-line pl-4">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal/70" />
                <p className="text-[0.85rem] font-semibold text-ink">{formatHistoryEvent(h)}</p>
                <p className="tnum text-[0.72rem] text-ink-3">
                  {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Delete confirmation sheet */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center" onClick={() => setConfirmDelete(false)}>
          <div className="sheet w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[1.05rem] font-extrabold text-ink">Delete “{item.title}”?</h2>
            <p className="mt-1 text-sm text-ink-2">
              This removes the item, its history and attachments from this browser. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger flex-1"
                onClick={() => {
                  void (async () => {
                    await deleteItem(item.id);
                    navigate({ view: "items" });
                  })();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RenewPanel({
  suggested,
  value,
  onChange,
  onCancel,
  onContinue,
}: {
  suggested: string;
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="anim-fade-in mt-3 rounded-2xl border border-line bg-surface p-4">
      <p className="mb-2 text-[0.85rem] font-bold text-ink">New date</p>
      <input
        type="date"
        className="input"
        min={todayStr()}
        value={value || suggested}
        onChange={(e) => onChange(e.target.value)}
        aria-label="New date"
      />
      <p className="field-note">Suggested: {formatDateLong(suggested)}</p>
      <div className="mt-3 flex gap-2">
        <button className="btn btn-secondary flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary flex-1" onClick={onContinue} disabled={!value}>
          Save new date
        </button>
      </div>
    </div>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case "due-soon": return "gold";
    case "overdue": return "clay";
    case "expired": return "red";
    case "completed": return "slate";
    case "archived": return "gray";
    default: return "teal";
  }
}

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export { Warning, CaretDown };
