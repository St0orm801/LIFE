// LANDING — deliberately minimal per spec §32. Hero + one CTA + a small live
// demonstration. No fake testimonials, awards or usage numbers.

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChartLineUp } from "@phosphor-icons/react";
import { diffDays, formatDateLong, todayStr } from "../lib/date-utils";

export const Route = createFileRoute("/")({
  component: Landing,
});

const DEMO: Array<{ label: string; date: string; verb: string; tone: string }> = [
  { label: "Passport", date: "2029-06-18", verb: "Expires", tone: "var(--color-cat-documents)" },
  { label: "Car Insurance", date: "2027-01-15", verb: "Renews", tone: "var(--color-cat-vehicle)" },
  { label: "Mom", date: "2026-09-10", verb: "Birthday", tone: "var(--color-cat-people)" },
  { label: "TV Warranty", date: "2028-08-08", verb: "Warranty ends", tone: "var(--color-cat-warranty)" },
  { label: "Milk", date: "2026-09-14", verb: "Best before", tone: "var(--color-cat-food)" },
];

function relative(d: string): string {
  const diff = diffDays(todayStr(), d);
  if (diff < 0) return `${-diff}d overdue`;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return `in ${diff} days`;
}

export default function Landing() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white">
            <ChartLineUp size={20} weight="bold" />
          </span>
          <span className="text-[0.98rem] font-extrabold tracking-tight text-ink">LIFE CLOCK</span>
        </div>
        <Link to="/app" className="btn btn-secondary btn-sm">
          Open app
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 pb-20">
        {/* Hero */}
        <section className="pt-10 text-center md:pt-16">
          <p className="mx-auto max-w-md text-balance text-[1.05rem] font-bold uppercase tracking-[0.14em] text-teal-deep">
            Everything important has a next date
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-[2.4rem] font-extrabold leading-[1.08] tracking-tight text-ink md:text-[3.4rem]">
            Passports, warranties, renewals, birthdays. Remembered.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-[1.02rem] leading-relaxed text-ink-2">
            Track expirations, renewals, maintenance and the dates that matter,
            in one simple place. Name + date. Done.
          </p>
          <div className="mt-8">
            <Link to="/app" className="btn btn-primary btn-lg">
              Start tracking
              <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
          <p className="mt-4 text-[0.8rem] text-ink-3">Free. No account. Works on your phone.</p>
        </section>

        {/* Live demonstration */}
        <section className="mx-auto mt-14 max-w-xl md:mt-20" aria-label="Example items">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-ink-3">Your next dates</span>
              <span className="chip chip-active pointer-events-none">Today · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <ul className="divide-y divide-line">
              {DEMO.map((d) => {
                const diff = diffDays(todayStr(), d.date);
                return (
                  <li key={d.label} className="flex items-center gap-3 px-5 py-3.5">
                    <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.tone }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.92rem] font-bold text-ink">{d.label}</span>
                      <span className="block text-[0.76rem] font-semibold text-ink-2">
                        {d.verb} · {formatDateLong(d.date)}
                      </span>
                    </span>
                    <span className={`tnum text-[0.82rem] font-extrabold ${diff < 0 ? "text-clay" : diff <= 7 ? "text-gold" : "text-ink-3"}`}>
                      {relative(d.date)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line bg-surface-2/60 px-5 py-3.5 text-[0.78rem] font-semibold text-ink-2">
              Example items shown — your own list is private to this browser.
            </div>
          </div>
        </section>

        {/* Value line */}
        <section className="mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-3 md:mt-20">
          {[
            ["Two-tap adding", "Most items are a preset, a date, save."],
            ["Built-in reminders", "Passports warn months ahead; milk warns days ahead."],
            ["Yours alone", "Local-first storage, no account, exportable anytime."],
          ].map(([t, d]) => (
            <div key={t} className="card p-5">
              <h2 className="text-[0.95rem] font-extrabold text-ink">{t}</h2>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-2">{d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <p className="text-center text-[0.78rem] font-semibold text-ink-3">
          LIFE CLOCK · Everything important has a next date.
        </p>
      </footer>
    </div>
  );
}