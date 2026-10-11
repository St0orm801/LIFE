// App store: items + history + attachment blobs, persisted to IndexedDB.
// All mutations go through the repository interface (storage.ts) so a future
// Cloudflare backend can replace the local impl without UI changes.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { todayStr, nextMonthDay, monthDayOf } from "./date-utils";
import { DEMO_ITEMS } from "./demo";
import { applyLifecycle, suggestedNewDate, type LifecycleResult } from "./lifecycle";
import { rolledDate } from "./recur";
import { repository, type ItemRepository } from "./storage";
import { uid } from "./store-utils";
import type {
  AttachmentMeta,
  HistoryEvent,
  HistoryType,
  Item,
} from "./types";
import { PRESET_BY_ID } from "./presets";
import { transitionPurchase, type PurchaseAction, purchaseStageLabels, purchaseStage } from './purchase';

const SEED_FLAG = "demo-seeded-v1";

export interface NewItemInput {
  presetId: string;
  title?: string;
  nextDate: string;
  monthDay?: string;
  notes?: string;
  amount?: number | null;
  reminderRules?: Item["reminderRules"];
  repeatRule?: Item["repeatRule"];
  autoRoll?: boolean;
  categoryId: string;
  actionType: Item["actionType"];
  metadata?: Item["metadata"];
}

export interface AppStoreValue {
  ready: boolean;
  items: Item[];
  getItem: (id: string) => Item | undefined;
  historyFor: (itemId: string) => Promise<HistoryEvent[]>;
  attachmentsFor: (itemId: string) => Map<string, Blob>;
  createItem: (input: NewItemInput) => Promise<Item>;
  purchaseAction: (id: string, action: PurchaseAction, followUp?: string) => Promise<void>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  setNotes: (id: string, notes: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  attachFiles: (itemId: string, files: File[], kind: AttachmentMeta["kind"]) => Promise<void>;
  removeAttachment: (itemId: string, attachmentId: string) => Promise<void>;
  lifecycle: (id: string, opts?: { newDate?: string }) => Promise<Item | undefined>;
  loadBlob: (attachmentId: string) => Promise<Blob | null>;
  seedDemo: () => Promise<void>;
  exportAll: () => Promise<string>;
  importAll: (json: string) => Promise<void>;
  wipeAll: () => Promise<void>;
}

const Ctx = createContext<AppStoreValue | null>(null);

export function useApp(): AppStoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

function historyLabel(type: HistoryType): string {
  switch (type) {
    case "created": return "Created";
    case "date-changed": return "Date changed";
    case "renewed": return "Renewed";
    case "replaced": return "Replaced";
    case "serviced": return "Serviced";
    case "consumed": return "Consumed";
    case "discarded": return "Discarded";
    case "completed": return "Completed";
    case "paid": return "Paid";
    case "returned": return "Returned";
    case "archived": return "Archived";
    case "restored": return "Restored";
    case "auto-advanced": return "Auto-advanced";
    case "edited": return "Edited";
  }
}

export function formatHistoryEvent(ev: HistoryEvent): string {
  if (ev.note) return ev.note;
  const base = historyLabel(ev.type);
  if (ev.oldDate && ev.newDate && ev.oldDate !== ev.newDate) {
    return `${base}: ${ev.oldDate} → ${ev.newDate}`;
  }
  if (ev.newDate) return `${base}: ${ev.newDate}`;
  return base;
}

export function AppProvider({ children, repo = repository }: { children: ReactNode; repo?: ItemRepository }) {
  const repoRef = useRef(repo);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [blobs, setBlobs] = useState<Map<string, Blob>>(new Map());
  const [ready, setReady] = useState(false);

  // Initial load + demo seed on first run (synthetic data only, §49).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allItems, allHistory, flagged] = await Promise.all([
          // history loads lazily per item; seed flag check only
          repoRef.current.getAllItems(),
          Promise.resolve([] as HistoryEvent[]),
          repoRef.current.getMeta(SEED_FLAG).catch(() => null),
        ]);
        if (cancelled) return;
        let seeded = false;
        let itemList = allItems;
        if (allItems.length === 0 && flagged !== "yes" && typeof window !== "undefined") {
          // First real run with data: demonstrate with synthetic items.
          await repoRef.current.putItems(DEMO_ITEMS);
          itemList = DEMO_ITEMS;
          seeded = true;
        }
        if (flagged !== "yes") {
          await repoRef.current.setMeta(SEED_FLAG, "yes");
        }
        // Auto-roll yearly items (birthdays/anniversaries) past today.
        const rolled = itemList.map((it) => {
          if (it.autoRoll && it.repeatRule?.kind === "yearly") {
            const nd = rolledDate(it.nextDate, todayStr());
            if (nd !== it.nextDate) return { ...it, nextDate: nd };
          }
          return it;
        });
        if (rolled.some((it, i) => it.nextDate !== itemList[i].nextDate)) {
          await repoRef.current.putItems(rolled);
        }
        setItems(rolled);
        setReady(true);
        void seeded;
      } catch (err) {
        console.error("failed to load lifec lock data", err);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const historyFor = useCallback(async (itemId: string) => repoRef.current.getHistory(itemId), []);

  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  const createItem = useCallback(async (input: NewItemInput): Promise<Item> => {
    const preset = PRESET_BY_ID[input.presetId];
    const now = Date.now();
    const item: Item = {
      id: uid("item-"),
      title: input.title?.trim() || preset?.name || "Item",
      categoryId: input.categoryId || preset?.categoryId || "other",
      presetId: input.presetId,
      actionType: input.actionType || preset?.actionType || "custom",
      nextDate: input.nextDate,
      monthDay: input.monthDay,
      repeatRule: input.repeatRule ?? preset?.defaultRepeat ?? null,
      reminderRules: input.reminderRules ??
        (preset?.defaultReminders ?? [30, 7]).map((offset) => ({
          offset,
          // Preset defaults are DAYS — "30" means 30 days, never 30 months.
          unit: "day",
          enabled: true,
        })),
      autoRoll: input.autoRoll ?? (input.monthDay ? true : false),
      status: "active",
      notes: input.notes?.trim() || undefined,
      amount: input.amount ?? null,
      attachments: [],
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };
    await repoRef.current.putItem(item);
    await repoRef.current.putHistory({
      id: uid("h-"),
      itemId: item.id,
      type: "created",
      date: now,
      newDate: item.nextDate,
    });
    setItems((prev) => [...prev, item]);
    return item;
  }, []);

  const updateItem = useCallback(async (id: string, patch: Partial<Item>) => {
    const prev = await repoRef.current.getItem(id);
    if (!prev) return;
    const next = { ...prev, ...patch, updatedAt: Date.now() };
    await repoRef.current.putItem(next);
    setItems((prevList) => prevList.map((i) => (i.id === id ? next : i)));
    void historyFor(id).then((h) => h);
  }, [historyFor]);

  const setNotes = useCallback(async (id: string, notes: string) => {
    await updateItem(id, { notes: notes.trim() || undefined });
  }, [updateItem]);

  const purchaseAction = useCallback(async (id: string, action: PurchaseAction, followUp?: string) => {
    const prev = await repoRef.current.getItem(id);
    if (!prev) throw new Error('Item unavailable');
    const patch = transitionPurchase(prev, action, followUp);
    const next = { ...prev, ...patch, updatedAt: Date.now() };
    await repoRef.current.putItem(next);
    await repoRef.current.putHistory({ id: uid('h-'), itemId: id, type: action === 'refund' ? 'completed' : 'edited', date: Date.now(), oldDate: prev.nextDate, newDate: next.nextDate, note: purchaseStageLabels[purchaseStage(next)] });
    setItems(list => list.map(item => item.id === id ? next : item));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await repoRef.current.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const archiveItem = useCallback(async (id: string) => {
    const prev = await repoRef.current.getItem(id);
    if (!prev) return;
    const next: Item = { ...prev, status: "archived", archivedAt: Date.now(), updatedAt: Date.now() };
    await repoRef.current.putItem(next);
    await repoRef.current.putHistory({
      id: uid("h-"), itemId: id, type: "archived", date: Date.now(),
    });
    setItems((prevList) => prevList.map((i) => (i.id === id ? next : i)));
  }, []);

  const restoreItem = useCallback(async (id: string) => {
    const prev = await repoRef.current.getItem(id);
    if (!prev) return;
    const next: Item = {
      ...prev,
      status: prev.status === "completed" ? "completed" : "active",
      archivedAt: undefined,
      updatedAt: Date.now(),
    };
    await repoRef.current.putItem(next);
    await repoRef.current.putHistory({
      id: uid("h-"), itemId: id, type: "restored", date: Date.now(),
    });
    setItems((prevList) => prevList.map((i) => (i.id === id ? next : i)));
  }, []);

  const attachFiles = useCallback(async (itemId: string, files: File[], kind: AttachmentMeta["kind"]) => {
    const prev = await repoRef.current.getItem(itemId);
    if (!prev) return;
    const metas: AttachmentMeta[] = [];
    for (const file of files) {
      const id = uid("att-");
      await repoRef.current.putAttachment({ id, blob: file });
      metas.push({
        id, kind, filename: file.name || (kind === "photo" ? "photo" : "file"),
        mime: file.type, size: file.size, createdAt: Date.now(),
      });
    }
    const next: Item = {
      ...prev,
      attachments: [...prev.attachments, ...metas],
      updatedAt: Date.now(),
    };
    await repoRef.current.putItem(next);
    setItems((prevList) => prevList.map((i) => (i.id === itemId ? next : i)));
  }, []);

  const removeAttachment = useCallback(async (itemId: string, attachmentId: string) => {
    const prev = await repoRef.current.getItem(itemId);
    if (!prev) return;
    await repoRef.current.deleteAttachment(attachmentId);
    const next: Item = {
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== attachmentId),
      updatedAt: Date.now(),
    };
    await repoRef.current.putItem(next);
    setItems((prevList) => prevList.map((i) => (i.id === itemId ? next : i)));
  }, []);

  const loadBlob = useCallback(async (attachmentId: string) => {
    const all = await repoRef.current.getAllBlobMap();
    const blob = all.get(attachmentId);
    if (blob) setBlobs((prev) => new Map(prev).set(attachmentId, blob));
    return blob ?? null;
  }, []);

  const lifecycle = useCallback(async (id: string, opts?: { newDate?: string }): Promise<Item | undefined> => {
    const prev = await repoRef.current.getItem(id);
    if (!prev) return undefined;
    const result: LifecycleResult = applyLifecycle(prev, opts);
    // Manual date required upstream (Renew flow) — nothing to persist yet.
    if (!result.completed && !result.nextDate) return prev;
    const now = Date.now();
    const base: Item = { ...prev, updatedAt: now };
    let next: Item;
    if (result.completed) {
      next = { ...base, status: "completed", completedAt: now };
    } else if (result.nextDate) {
      next = { ...base, nextDate: result.nextDate };
    } else {
      next = base; // manual date required upstream (Renew flow)
    }
    // Yearly with no explicit month-day keeps rolling.
    if (next.monthDay && next.repeatRule?.kind === "yearly" && !result.nextDate) {
      next = { ...next, nextDate: nextMonthDay(next.monthDay) };
    }
    await repoRef.current.putItem(next);
    await repoRef.current.putHistory({
      id: uid("h-"),
      itemId: id,
      type: result.historyType,
      date: now,
      oldDate: prev.nextDate,
      newDate: result.nextDate,
      note: result.note,
    });
    setItems((prevList) => prevList.map((i) => (i.id === id ? next : i)));
    return next;
  }, []);

  const seedDemo = useCallback(async () => {
    await repoRef.current.putItems(DEMO_ITEMS);
    await repoRef.current.setMeta(SEED_FLAG, "yes");
    setItems(DEMO_ITEMS);
  }, []);

  const exportAll = useCallback(async () => {
    const payload = await repoRef.current.exportAll();
    return JSON.stringify(payload, null, 2);
  }, []);

  const importAll = useCallback(async (json: string) => {
    const payload = JSON.parse(json) as Awaited<ReturnType<ItemRepository["exportAll"]>>;
    await repoRef.current.importAll(payload);
    const all = await repoRef.current.getAllItems();
    setItems(all);
    setBlobs(new Map());
  }, []);

  const wipeAll = useCallback(async () => {
    await repoRef.current.wipe();
    await repoRef.current.setMeta(SEED_FLAG, "yes");
    setItems([]);
    setHistory([]);
    setBlobs(new Map());
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      ready,
      items,
      getItem,
      historyFor,
      attachmentsFor: (itemId) => {
        const m = new Map<string, Blob>();
        const item = items.find((i) => i.id === itemId);
        item?.attachments.forEach((a) => {
          const b = blobs.get(a.id);
          if (b) m.set(a.id, b);
        });
        return m;
      },
      createItem,
      purchaseAction,
      updateItem,
      setNotes,
      deleteItem,
      archiveItem,
      restoreItem,
      attachFiles,
      removeAttachment,
      lifecycle,
      loadBlob,
      seedDemo,
      exportAll,
      importAll,
      wipeAll,
    }),
    [ready, items, blobs, history, getItem, historyFor, createItem, purchaseAction, updateItem, setNotes,
     deleteItem, archiveItem, restoreItem, attachFiles, removeAttachment, lifecycle,
     loadBlob, seedDemo, exportAll, importAll, wipeAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { suggestedNewDate, monthDayOf };
