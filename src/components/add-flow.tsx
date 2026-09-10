// ADD FLOW — "What do you want to track?" then a tiny form. NAME + DATE, DONE.
// Major categories first, popular presets, search across the whole library,
// "More" reveals the less common groups. Food gets its own barcode/manual entry.

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  CaretRight,
  MagnifyingGlass,
  Paperclip,
  Plus,
  X,
} from "@phosphor-icons/react";
import {
  formatOffsetDays,
  formatRemainingDays,
  reminderOccurrence,
  todayStr,
  nextMonthDay,
  monthDayOf,
} from "../lib/date-utils";
import { useApp } from "../lib/store";
import { CATEGORIES, MAJOR_CATEGORIES, POPULAR_PRESETS, PRESET_BY_ID, CATEGORY_BY_ID } from "../lib/presets";
import { searchPresets } from "../lib/search";
import type { OptionalField, Preset } from "../lib/types";
import { CatDot } from "./ui";

type Step = "home" | "category" | "form";

export function AddFlow({ onClose }: { onClose: () => void }) {
  const { ready, createItem, attachFiles } = useApp();
  const [step, setStep] = useState<Step>("home");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [saved, setSaved] = useState(false);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return searchPresets(q);
  }, [query]);

  const pickPreset = (p: Preset) => {
    if (p.special === "food") {
      setPreset(p);
      setStep("form");
      return;
    }
    setPreset(p);
    setStep("form");
  };

  const onSaved = async () => {
    setSaved(true);
    await new Promise((r) => setTimeout(r, 650));
    onClose();
  };

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Header */}
      <header className="safe-top sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2"
            aria-label="Close"
            onClick={() => (step === "home" ? onClose() : step === "category" ? setStep("home") : setStep("category"))}
          >
            {step === "home" ? <X size={22} /> : <ArrowLeft size={22} />}
          </button>
          <h1 className="text-[1rem] font-extrabold tracking-tight text-ink">
            {step === "home" ? "What do you want to track?" : step === "category" ? (CATEGORY_BY_ID[categoryId ?? ""]?.name ?? "Pick one") : (preset?.name ?? "Add item")}
          </h1>
          <div className="w-10" />
        </div>
        {step === "home" ? (
          <div className="mx-auto w-full max-w-2xl px-4 pb-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
              <MagnifyingGlass size={18} />
            </span>
              <input
                className="input pl-10"
                placeholder="Search, e.g. passport, licence, filter, insurance"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search preset library"
                autoFocus
              />
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-10 pt-4">
        {step === "home" ? (
          query.trim().length >= 2 ? (
            <SearchResults results={results} onPick={pickPreset} onBackToBrowse={() => setQuery("")} />
          ) : (
            <BrowseHome
              showAll={showAllCategories}
              onToggleAll={() => setShowAllCategories((v) => !v)}
              onPickCategory={(id) => {
                setCategoryId(id);
                setStep("category");
              }}
              onPickPreset={pickPreset}
              onPickFood={() => {
                pickPreset(PRESET_BY_ID["food-item"]);
              }}
            />
          )
        ) : step === "category" && categoryId ? (
          <CategoryPresets
            categoryId={categoryId}
            onPick={pickPreset}
            onBack={() => setStep("home")}
          />
        ) : preset ? (
          <PresetForm
            key={preset.id}
            preset={preset}
            onSaved={onSaved}
          />
        ) : null}
      </div>

      {saved ? (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
          <div className="anim-pop flex h-20 w-20 items-center justify-center rounded-full bg-teal text-white">
            <span className="rotate-45">
              <Plus size={38} weight="bold" />
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BrowseHome({
  showAll,
  onToggleAll,
  onPickCategory,
  onPickPreset,
  onPickFood,
}: {
  showAll: boolean;
  onToggleAll: () => void;
  onPickCategory: (id: string) => void;
  onPickPreset: (p: Preset) => void;
  onPickFood: () => void;
}) {
  const cats = showAll ? CATEGORIES : MAJOR_CATEGORIES;
  return (
    <div className="anim-fade-up">
      {/* Popular */}
      <section className="mb-6">
        <h2 className="mb-2.5 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-ink-3">Popular</h2>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {POPULAR_PRESETS.map((p) => (
            <button key={p.id} className="chip" onClick={() => onPickPreset(p)}>
              <CatDot categoryId={p.categoryId} size={8} />
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-2.5 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-ink-3">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => onPickCategory(c.id)}
              className="card anim-fade-in flex items-center gap-3 p-4 text-left transition-transform active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${c.color} 15%, white)` }}>
                <CatDot categoryId={c.id} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9rem] font-bold text-ink">{c.shortName}</span>
                <span className="block text-[0.72rem] font-semibold text-ink-3">{c.name}</span>
              </span>
            </button>
          ))}
        </div>
        <button className="btn btn-secondary mt-3 btn-block" onClick={onToggleAll}>
          {showAll ? "Show popular categories only" : "More categories"}
        </button>
      </section>
    </div>
  );
}

function SearchResults({
  results,
  onPick,
  onBackToBrowse,
}: {
  results: Preset[];
  onPick: (p: Preset) => void;
  onBackToBrowse: () => void;
}) {
  return (
    <div className="anim-fade-up">
      {results.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="text-ink-3">
            <MagnifyingGlass size={30} />
          </span>
          <p className="mt-3 text-[0.92rem] font-bold text-ink">No matches</p>
          <p className="mt-1 max-w-xs text-[0.82rem] text-ink-3">
            Try another word, or use the general presets under Other.
          </p>
          <button className="btn btn-primary mt-5" onClick={onBackToBrowse}>
            Browse categories
          </button>
        </div>
      ) : (
        <ul className="card-flat divide-y divide-line px-1.5 py-1">
          {results.map((p) => (
            <li key={p.id}>
              <button className="row-btn" onClick={() => onPick(p)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${CATEGORY_BY_ID[p.categoryId]?.color ?? "#8a8274"} 14%, white)` }}>
                  <CatDot categoryId={p.categoryId} size={16} />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[0.92rem] font-bold text-ink">{p.name}</span>
                  <span className="block text-[0.74rem] font-semibold text-ink-3">
                    {CATEGORY_BY_ID[p.categoryId]?.shortName} · {p.dateLabel}
                  </span>
                </span>
                <span className="text-ink-3">
                  <CaretRight size={16} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryPresets({
  categoryId,
  onPick,
  onBack,
}: {
  categoryId: string;
  onPick: (p: Preset) => void;
  onBack: () => void;
}) {
  const presets = Object.values(PRESET_BY_ID).filter((p) => p.categoryId === categoryId);
  const cat = CATEGORY_BY_ID[categoryId];
  return (
    <div className="anim-fade-up">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${cat?.color ?? "#8a8274"} 15%, white)` }}>
          <CatDot categoryId={categoryId} size={16} />
        </span>
        <p className="text-[0.85rem] font-semibold text-ink-2">
          {presets.length} presets · mostly name + date
        </p>
      </div>
      <ul className="card-flat divide-y divide-line px-1.5 py-1">
        {presets.map((p) => (
          <li key={p.id}>
            <button className="row-btn" onClick={() => onPick(p)}>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[0.92rem] font-bold text-ink">{p.name}</span>
                <span className="block text-[0.74rem] font-semibold text-ink-3">{p.dateLabel}</span>
              </span>
              <span className="text-ink-3">
                <CaretRight size={16} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── The minimal form ───────────────────────────────────────────────────────

function PresetForm({ preset, onSaved }: { preset: Preset; onSaved: () => Promise<void> }) {
  const { createItem, attachFiles } = useApp();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [customReminders, setCustomReminders] = useState<string[]>(
    preset.defaultReminders.map((d) => String(d)),
  );
  const [repeatEvery, setRepeatEvery] = useState(
    preset.defaultRepeat?.kind === "every-n-months" ? String(preset.defaultRepeat.every ?? 3) : "",
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const needsTitle = !!preset.titleLabel;
  const isFood = preset.special === "food";
  const today = todayStr();

  const canSave = (isFood ? title.trim().length > 0 && date : true) && date.length > 0;

  const save = async () => {
    if (!date) {
      setError("Pick a date first.");
      return;
    }
    if (date < today && !(preset.actionType === "birthday" || preset.actionType === "anniversary")) {
      const ok = window.confirm("This date is in the past. Save it anyway?");
      if (!ok) return;
    }
    const monthDay = preset.actionType === "birthday" || preset.actionType === "anniversary"
      ? monthDayOf(date)
      : undefined;
    const nextDate = monthDay
      ? nextMonthDay(monthDay)
      : date;

    const rules = customReminders
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const n = Number(s);
        return {
          offset: Number.isFinite(n) && n > 0 ? n : 30,
          unit: "day" as const,
          enabled: true,
        };
      });

    const repeatRule =
      preset.defaultRepeat?.kind === "every-n-months"
        ? { kind: "every-n-months" as const, every: clamp(Number(repeatEvery) || 3, 1, 36) }
        : preset.defaultRepeat ?? null;

    const meta = isFood && barcode.trim() ? { barcode: barcode.trim() } : undefined;

    const created = await createItem({
      presetId: preset.id,
      title: needsTitle ? title || preset.name : title || preset.name,
      nextDate,
      monthDay,
      notes: notes || undefined,
      amount: /\d/.test(amount) ? Number(amount) : null,
      reminderRules: rules,
      repeatRule,
      autoRoll: !!monthDay,
      categoryId: preset.categoryId,
      actionType: preset.actionType,
      metadata: meta,
    });
    // Attach files picked before save (the item must exist first).
    const pending = (window as unknown as { __lcPendingFiles?: File[] }).__lcPendingFiles;
    if (pending && pending.length > 0 && created) {
      const kind = pending.every((f) => f.type.startsWith("image/")) ? "photo" : "file";
      await attachFiles(created.id, pending, kind);
      (window as unknown as { __lcPendingFiles?: File[] }).__lcPendingFiles = undefined;
    }
    await onSaved();
  };

  const canMore = preset.optionalFields.length > 0;

  return (
    <form
      className="anim-fade-up"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {/* Title */}
      {isFood ? (
        <div className="mb-4">
          <FoodEntry
            barcode={barcode}
            onBarcode={setBarcode}
            title={title}
            onTitle={setTitle}
            onPickFile={() => fileRef.current?.click()}
          />
        </div>
      ) : needsTitle ? (
        <Field label={preset.titleLabel ?? "Name"}>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={preset.titleLabel ?? "Name"}
            aria-label={preset.titleLabel}
            autoFocus
          />
        </Field>
      ) : (
        <p className="mb-4 rounded-2xl surface-2 px-4 py-3 text-[0.92rem] font-semibold text-ink-2">
          {preset.name}
          <span className="mt-0.5 block text-[0.74rem] font-semibold text-ink-3">
            Add a custom title in More options if you track several of these.
          </span>
        </p>
      )}

      {/* Date */}
      <Field label={preset.dateLabel}>
        <input
          type="date"
          className="input"
          value={date}
          min={preset.actionType === "birthday" || preset.actionType === "anniversary" ? undefined : "1900-01-01"}
          onChange={(e) => setDate(e.target.value)}
          aria-label={preset.dateLabel}
        />
        {preset.actionType === "birthday" || preset.actionType === "anniversary" ? (
          <p className="field-note">Year is optional — LIFE CLOCK remembers the month and day.</p>
        ) : null}
      </Field>

      {/* Reminder summary */}
      <div className="mt-4 flex items-center justify-between rounded-2xl surface-2 px-4 py-3">
        <span className="text-[0.85rem] font-semibold text-ink-2">
          Reminders:{" "}
          <span className="font-bold text-ink">
            {customReminders.filter((r) => r.trim()).map((r) => formatOffsetDays(Number(r))).join(" and ") || "none"}
          </span>{" "}
          before
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMoreOpen((v) => !v)}>
          Change
        </button>
      </div>

      {/* More options */}
      {canMore ? (
        <details open={moreOpen} onToggle={(e) => setMoreOpen((e.target as HTMLDetailsElement).open)}>
          <summary className="cursor-pointer py-3 text-[0.85rem] font-bold text-teal underline-offset-4 hover:underline">
            More options
          </summary>
          <div className="space-y-4 pb-2">
            {preset.optionalFields.includes("custom-title") ? (
              <Field label="Custom title (optional)">
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={preset.name} />
              </Field>
            ) : null}
            {preset.optionalFields.includes("amount") ? (
              <Field label="Amount (optional)">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
            ) : null}
            {preset.optionalFields.includes("custom-reminders") ? (
              <Field label="Remind me">
                <ReminderEditor
                  values={customReminders}
                  onChange={setCustomReminders}
                  preset={preset}
                />
              </Field>
            ) : null}
            {preset.optionalFields.includes("repeat") && preset.defaultRepeat?.kind === "every-n-months" ? (
              <Field label={`Repeat every (months${preset.defaultRepeat?.every ? `, default ${preset.defaultRepeat.every}` : ""})`}>
                <input className="input" type="number" min="1" max="36" value={repeatEvery} onChange={(e) => setRepeatEvery(e.target.value)} />
              </Field>
            ) : null}
            {preset.optionalFields.includes("notes") ? (
              <Field label="Notes (optional)">
                <textarea className="input min-h-[70px] resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Renew online, call broker, bought at…" />
              </Field>
            ) : null}
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => fileRef.current?.click()}>
                <Paperclip size={16} />
                Add photo or file
              </button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,application/pdf,.pdf" multiple onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) {
                  // Save happens first; the files attach after creation via item id — handled in onSaved by attach from the created item.
                  (window as unknown as { __lcPendingFiles?: File[] }).__lcPendingFiles = files;
                  setError(null);
                }
                e.target.value = "";
              }} />
            </div>
          </div>
        </details>
      ) : null}

      {error ? <p className="mt-3 text-[0.85rem] font-semibold text-clay">{error}</p> : null}

      {/* Save */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur safe-bottom">
        <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={!canSave}>
          <Plus size={20} weight="bold" />
          Save
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ReminderEditor({
  values,
  onChange,
  preset,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  preset: Preset;
}) {
  const setAt = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };
  const add = () => {
    const last = Number(values[values.length - 1] ?? 1);
    onChange([...values.map(String), String(Math.max(1, Math.floor(last / 2)))]);
  };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {values.filter((v) => v.trim()).map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="input flex-1"
            type="number"
            min="1"
            value={v}
            onChange={(e) => setAt(i, e.target.value)}
            aria-label="Reminder offset in days"
          />
          <span className="text-[0.82rem] font-semibold text-ink-3">days before</span>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Remove reminder" onClick={() => remove(i)}>
            <X size={16} />
          </button>
        </div>
      ))}
      {values.length < 4 ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
          <Plus size={15} />
          Add reminder
        </button>
      ) : null}
    </div>
  );
}

function FoodEntry({
  barcode,
  onBarcode,
  title,
  onTitle,
  onPickFile,
}: {
  barcode: string;
  onBarcode: (v: string) => void;
  title: string;
  onTitle: (v: string) => void;
  onPickFile: () => void;
}) {
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`btn ${barcode.trim() ? "btn-primary" : "btn-secondary"}`}
          onClick={() => document.getElementById("barcode-input")?.focus()}
        >
          <Barcode size={18} />
          Barcode
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onBarcode("");
            document.getElementById("food-name")?.focus();
          }}
        >
          Add manually
        </button>
      </div>
      {barcode.trim() ? (
        <Field label="Barcode">
          <input
            id="barcode-input"
            className="input tnum"
            inputMode="numeric"
            placeholder="Scan or type the barcode"
            value={barcode}
            onChange={(e) => onBarcode(e.target.value)}
            aria-label="Barcode"
          />
          <p className="field-note">
            The code is stored with the item. Automatic product lookup arrives with the cloud phase — no fake data is used.
          </p>
        </Field>
      ) : null}
      <Field label="Product name">
        <input
          id="food-name"
          className="input"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="e.g. Milk, Yogurt"
          aria-label="Product name"
        />
      </Field>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export { PRESET_BY_ID, CATEGORY_BY_ID, formatRemainingDays, reminderOccurrence };