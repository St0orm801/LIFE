// Local-first storage: IndexedDB behind a repository interface.
// The interface is the seam a future Cloudflare backend (D1 + R2) can replace
// or complement without touching domain logic. Attachments are stored as Blobs
// in IndexedDB — never localStorage — and capped in size.

import type { AttachmentMeta, HistoryEvent, Item } from "./types";

export interface AttachmentBlob {
  id: string;
  blob: Blob;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  items: Item[];
  history: HistoryEvent[];
  attachments: AttachmentBlob[];
}

export interface ItemRepository {
  getAllItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  putItem(item: Item): Promise<void>;
  putItems(items: Item[]): Promise<void>;
  deleteItem(id: string): Promise<void>;
  getHistory(itemId: string): Promise<HistoryEvent[]>;
  putHistory(event: HistoryEvent): Promise<void>;
  putHistoryMany(events: HistoryEvent[]): Promise<void>;
  deleteHistory(itemId: string): Promise<void>;
  getAttachments(itemId: string): Promise<AttachmentBlob[]>;
  getAllBlobMap(): Promise<Map<string, Blob>>;
  putAttachment(blob: AttachmentBlob): Promise<void>;
  deleteAttachment(id: string): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
  exportAll(): Promise<BackupPayload>;
  importAll(payload: BackupPayload): Promise<void>;
  wipe(): Promise<void>;
}

const DB_NAME = "life-clock";
const DB_VERSION = 1;
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB cap per file

const STORES = ["items", "history", "attachments", "meta"] as const;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("items")) {
        const s = db.createObjectStore("items", { keyPath: "id" });
        s.createIndex("categoryId", "categoryId");
        s.createIndex("nextDate", "nextDate");
        s.createIndex("status", "status");
      }
      if (!db.objectStoreNames.contains("history")) {
        const s = db.createObjectStore("history", { keyPath: "id" });
        s.createIndex("itemId", "itemId");
      }
      if (!db.objectStoreNames.contains("attachments")) {
        db.createObjectStore("attachments", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: (typeof STORES)[number],
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromIndex<T>(
  db: IDBDatabase,
  store: (typeof STORES)[number],
  index: string,
  value: string,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readonly");
    const req = t.objectStore(store).index(index).getAll(value);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore<T>(db: IDBDatabase, store: (typeof STORES)[number]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readonly");
    const req = t.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function clearStore(db: IDBDatabase, store: (typeof STORES)[number]): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readwrite");
    const req = t.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDbRepository implements ItemRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) this.dbPromise = openDb();
    return this.dbPromise;
  }

  async getAllItems(): Promise<Item[]> {
    const db = await this.db();
    return getAllFromStore<Item>(db, "items");
  }

  async getItem(id: string): Promise<Item | undefined> {
    const db = await this.db();
    return tx<Item | undefined>(db, "items", "readonly", (s) => s.get(id));
  }

  async putItem(item: Item): Promise<void> {
    const db = await this.db();
    await tx(db, "items", "readwrite", (s) => s.put(item));
  }

  async putItems(items: Item[]): Promise<void> {
    if (items.length === 0) return;
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction("items", "readwrite");
      for (const item of items) t.objectStore("items").put(item);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  async deleteItem(id: string): Promise<void> {
    const db = await this.db();
    // Collect attachment ids BEFORE deleting the item — getAttachments resolves
    // them via the item record, which is gone once we delete the item.
    const item = await this.getItem(id);
    const attachmentIds = item?.attachments.map((a) => a.id) ?? [];
    await tx(db, "items", "readwrite", (s) => s.delete(id));
    await this.deleteHistory(id);
    if (attachmentIds.length > 0) {
      const t = db.transaction("attachments", "readwrite");
      attachmentIds.forEach((aid) => t.objectStore("attachments").delete(aid));
      await new Promise<void>((resolve, reject) => {
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      });
    }
  }

  async getHistory(itemId: string): Promise<HistoryEvent[]> {
    const db = await this.db();
    return getAllFromIndex<HistoryEvent>(db, "history", "itemId", itemId);
  }

  async putHistory(event: HistoryEvent): Promise<void> {
    const db = await this.db();
    await tx(db, "history", "readwrite", (s) => s.put(event));
  }

  async putHistoryMany(events: HistoryEvent[]): Promise<void> {
    if (events.length === 0) return;
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction("history", "readwrite");
      for (const e of events) t.objectStore("history").put(e);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  async deleteHistory(itemId: string): Promise<void> {
    const db = await this.db();
    const rows = await getAllFromIndex<HistoryEvent>(db, "history", "itemId", itemId);
    const t = db.transaction("history", "readwrite");
    rows.forEach((r) => t.objectStore("history").delete(r.id));
    await new Promise<void>((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  async getAttachments(itemId: string): Promise<AttachmentBlob[]> {
    const db = await this.db();
    const all = await getAllFromStore<AttachmentBlob & { itemId?: unknown }>(db, "attachments");
    // itemId association lives on the Item, not the blob record, so load via items.
    const item = await this.getItem(itemId);
    if (!item) return [];
    const ids = new Set(item.attachments.map((a) => a.id));
    return all.filter((a) => ids.has(a.id)).map((a) => ({ id: a.id, blob: a.blob }));
  }

  async getAllBlobMap(): Promise<Map<string, Blob>> {
    const db = await this.db();
    const all = await getAllFromStore<AttachmentBlob>(db, "attachments");
    return new Map(all.map((a) => [a.id, a.blob]));
  }

  async putAttachment(blob: AttachmentBlob): Promise<void> {
    if (blob.blob.size > MAX_ATTACHMENT_BYTES) {
      throw new Error("attachment-too-large");
    }
    const db = await this.db();
    await tx(db, "attachments", "readwrite", (s) => s.put(blob));
  }

  async deleteAttachment(id: string): Promise<void> {
    const db = await this.db();
    await tx(db, "attachments", "readwrite", (s) => s.delete(id));
  }

  async getMeta(key: string): Promise<string | null> {
    const db = await this.db();
    const row = await tx<{ key: string; value: string } | undefined>(db, "meta", "readonly", (s) => s.get(key));
    return row?.value ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    const db = await this.db();
    await tx(db, "meta", "readwrite", (s) => s.put({ key, value }));
  }

  async exportAll(): Promise<BackupPayload> {
    const db = await this.db();
    const [items, history, attachments] = await Promise.all([
      getAllFromStore<Item>(db, "items"),
      getAllFromStore<HistoryEvent>(db, "history"),
      getAllFromStore<{ id: string; blob: Blob }>(db, "attachments"),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      history,
      attachments: attachments.map((a) => ({ id: a.id, blob: a.blob })),
    };
  }

  async importAll(payload: BackupPayload): Promise<void> {
    if (payload?.version !== 1 || !Array.isArray(payload.items) || !Array.isArray(payload.history) || !Array.isArray(payload.attachments)) throw new Error('Invalid backup');
    const ids = new Set<string>();
    for (const item of payload.items) {
      if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) || typeof item.title !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.nextDate) || !['active', 'archived', 'completed'].includes(item.status) || !Array.isArray(item.attachments) || !Array.isArray(item.reminderRules)) throw new Error('Invalid backup item');
      ids.add(item.id);
    }
    for (const event of payload.history) if (!event || typeof event.id !== 'string' || !ids.has(event.itemId) || !Number.isFinite(event.date)) throw new Error('Invalid backup history');
    for (const file of payload.attachments) if (!file || typeof file.id !== 'string' || !(file.blob instanceof Blob) || file.blob.size > MAX_ATTACHMENT_BYTES) throw new Error('Invalid backup attachment');
    const db = await this.db();
    const t = db.transaction(['items', 'history', 'attachments'], 'readwrite');
    for (const name of ['items', 'history', 'attachments']) t.objectStore(name).clear();
    payload.items.forEach(item => t.objectStore('items').put(item));
    payload.history.forEach(event => t.objectStore('history').put(event));
    payload.attachments.forEach(file => t.objectStore('attachments').put(file));
    await new Promise<void>((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  async wipe(): Promise<void> {
    const db = await this.db();
    await Promise.all(STORES.map((s) => clearStore(db, s)));
  }
}

export const repository = new IndexedDbRepository();
