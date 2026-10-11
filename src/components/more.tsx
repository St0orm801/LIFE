// MORE — settings, notifications, calendar export, data backup, about.
// Everything optional lives here, incl. honest capability notes.

import { useRef, useState } from "react";
import {
  Bell,
  CalendarBlank,
  DownloadSimple,
  FileArrowUp,
  Info,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useApp } from "../lib/store";
import { downloadIcs } from "../lib/ics";
import {
  isGranted,
  notificationsSupported,
  permissionState,
  requestPermission,
} from "../lib/notify";
import type { Route } from "./app-shell";
import { enableDeviceReminders, isNativeApp } from "../lib/device-reminders";
import { exportTextFile } from "../lib/export-file";
import { PhoneReminders } from './phone-reminders';

export function MoreView({ navigate }: { navigate: (r: Route) => void }) {
  const { items, exportAll, importAll, wipeAll } = useApp();
  const [notif, setNotif] = useState(permissionState());
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const backup = async () => {
    try {
    const json = await exportAll();
    await exportTextFile(`life-clock-backup-${new Date().toISOString().slice(0, 10)}.json`, json, "application/json");
    setMsg(isNativeApp() ? "Backup export opened. Choose where to save it." : "Backup downloaded.");
    } catch {
      setMsg("Backup export did not complete. You can try again.");
    }
  };

  const restore = async (file: File) => {
    try {
      const text = await file.text();
      await importAll(text);
      setMsg("Backup restored. All views updated.");
    } catch {
      setMsg("That file could not be read as a LIFE CLOCK backup.");
    }
  };

  const enableNotifs = async () => {
    if (isNativeApp()) {
      try {
        const state = await enableDeviceReminders(items);
        setMsg(state === "granted" ? "Device reminders scheduled at your selected time: up to 60 upcoming reminders, refreshed when you open or update the app." : "Allow notifications in your phone settings to enable reminders.");
      } catch {
        setMsg("Could not schedule reminders. Try again or check your phone notification settings.");
      }
      return;
    }
    const p = await requestPermission();
    setNotif(p);
    setMsg(p === "granted" ? "Reminders are on while this page is open." : "Notifications are blocked by your browser.");
  };

  const nState = notificationsSupported() ? notif : "unsupported";

  return (
    <div className="anim-fade-up">
      <header className="mb-5">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-ink">More</h1>
      </header>

      <div className="space-y-4">
        <section className="card p-5 flex flex-wrap gap-4 text-sm"><a className="underline text-teal-deep" href="https://life.sevavtostrah.workers.dev/support.html" target="_blank" rel="noreferrer">Help & support</a><a className="underline text-teal-deep" href="https://life.sevavtostrah.workers.dev/privacy.html" target="_blank" rel="noreferrer">Privacy policy</a></section>
        <PhoneReminders />
        {/* Notifications */}
        <section className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[0.95rem] font-extrabold text-ink">
                <span className="text-teal">
                <Bell size={18} />
              </span>
                Reminders
              </h2>
              <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
                {isNativeApp() ? "Schedule reminders on this phone, including the due date, at your selected time. Delivery depends on your phone settings. The next 60 reminders are refreshed when you open or update the app." : "Keep track of reminder dates in the app and export them to your calendar. Browser notifications require this page to remain open; background push and email are not available."}
              </p>
            </div>
          </div>
          <div className="mt-3">
            {!isNativeApp() && nState === "granted" ? (
              <p className="inline-flex items-center gap-1.5 text-[0.8rem] font-bold text-teal-deep">
                <Bell size={14} weight="fill" /> Notifications enabled
              </p>
            ) : nState === "denied" ? (
              <p className="text-[0.8rem] font-semibold text-clay">Blocked by browser. Allow notifications in site settings.</p>
            ) : (
              <button className="btn btn-secondary" onClick={enableNotifs}>
                Turn on notifications
              </button>
            )}
          </div>
        </section>

        {/* Calendar export */}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-extrabold text-ink">
            <span className="text-teal">
            <CalendarBlank size={18} />
          </span>
            Calendar export (.ics)
          </h2>
          <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
            Download all active items and reminders as an .ics file, then import
            it into Google Calendar, Outlook, or Apple Calendar. Automatic
            two-way sync is planned with cloud accounts.
          </p>
          <button className="btn btn-secondary mt-3" onClick={() => { void downloadIcs(items).catch(() => setMsg("Calendar export did not complete. You can try again.")); }}>
            <DownloadSimple size={16} />
            Download .ics
          </button>
        </section>

        {/* Data */}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-extrabold text-ink">
            <span className="text-teal">
            <Info size={18} />
          </span>
            Your data
          </h2>
          <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
            Everything is stored locally in this browser (IndexedDB). No account,
            no server, no tracking. Back up as JSON to move devices or restore.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-secondary btn-sm" onClick={backup}>
              <DownloadSimple size={15} />
              Backup (JSON)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
              <FileArrowUp size={15} />
              Restore
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void restore(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <button className="btn btn-ghost btn-sm text-clay" onClick={() => setConfirmWipe(true)}>
              <Trash size={15} />
              Remove all data
            </button>
          </div>
        </section>

        {/* About */}
        <section className="card p-5">
          <h2 className="text-[0.95rem] font-extrabold text-ink">About LIFE CLOCK</h2>
          <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
            Everything important has a next date. Track expirations, renewals,
            maintenance, warranties, and the people you love in one simple place.
            Version 2.0 (local-first). Built as a standalone project; no account
            is ever required.
          </p>
        </section>
      </div>

      {msg ? (
        <div className="anim-pop fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-bold text-white shadow-pop">
          {msg}
        </div>
      ) : null}

      {confirmWipe ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 md:items-center" onClick={() => setConfirmWipe(false)}>
          <div className="sheet w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[1.05rem] font-extrabold text-ink">Remove all data?</h2>
            <p className="mt-1 text-sm text-ink-2">
              Every item, history entry and attachment in this browser is deleted. Make a backup first if you might need it.
            </p>
            <div className="mt-5 flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => setConfirmWipe(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger flex-1"
                onClick={() => {
                  void wipeAll();
                  setConfirmWipe(false);
                  setMsg("All data removed.");
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!notificationsSupported() ? <span className="hidden"><X /></span> : null}
    </div>
  );
}
