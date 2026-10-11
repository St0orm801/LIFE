import 'fake-indexeddb/auto';
import { test, expect } from 'bun:test';
import { encodeBackup, decodeBackup } from '../src/lib/backup-json';
import { IndexedDbRepository } from '../src/lib/storage';
import { DEMO_ITEMS } from '../src/lib/demo';

test('JSON backup retains receipt bytes, MIME and purchase metadata', async () => {
  const item = { ...DEMO_ITEMS[0], metadata: { purchase: true, purchaseStage: 'awaiting-refund', followUp: '2026-11-01' } };
  const restored = decodeBackup(await encodeBackup({ version: 1, exportedAt: '', items: [item], history: [], attachments: [{ id: 'receipt', blob: new Blob(['receipt bytes'], { type: 'application/pdf' }) }] }));
  expect(restored.items[0].metadata).toEqual(item.metadata);
  expect(await restored.attachments[0].blob.text()).toBe('receipt bytes');
  expect(restored.attachments[0].blob.type).toBe('application/pdf');
});
test('invalid backup does not remove existing records', async () => {
  const repo = new IndexedDbRepository();
  await repo.putItem(DEMO_ITEMS[0]);
  await expect(repo.importAll({ version: 1, exportedAt: '', items: [{ ...DEMO_ITEMS[0], nextDate: '' }], history: [], attachments: [] })).rejects.toThrow();
  expect(await repo.getItem(DEMO_ITEMS[0].id)).toBeDefined();
});
