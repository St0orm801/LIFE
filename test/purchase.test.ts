import { describe, expect, test } from 'bun:test';
import { DEMO_ITEMS } from '../src/lib/demo';
import { purchaseDeadlines, transitionPurchase } from '../src/lib/purchase';
import { buildIcs } from '../src/lib/ics';
import { planDeviceReminders } from '../src/lib/reminder-plan';
import type { Item } from '../src/lib/types';

const purchase: Item = { ...DEMO_ITEMS[0], id: 'purchase-test', actionType: 'return', repeatRule: null, nextDate: '2026-11-01', metadata: { purchase: true, purchaseStage: 'decide', returnBy: '2026-11-01', warrantyUntil: '2027-11-01' } };
describe('purchase follow-through', () => {
  test('uses the selected phone reminder time and falls back for invalid time', () => {
    const now = new Date('2026-10-01T00:00:00');
    const events = planDeviceReminders([purchase], now, '18:45');
    expect(events[0].at.getHours()).toBe(18);
    expect(events[0].at.getMinutes()).toBe(45);
    expect(planDeviceReminders([purchase], now, '25:99')[0].at.getHours()).toBe(9);
  });
  test('tracks both deadlines and exports distinct events', () => {
    expect(purchaseDeadlines(purchase)).toHaveLength(2);
    const ics = buildIcs([purchase]);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('UID:purchase-test-returnBy@life-clock');
    expect(ics).toContain('UID:purchase-test-warrantyUntil@life-clock');
    expect(planDeviceReminders([purchase], new Date('2026-10-01T00:00:00')).some(e => e.body.includes('Warranty ends'))).toBe(true);
  });
  test('return stays open until user confirms refund', () => {
    const started = { ...purchase, ...transitionPurchase(purchase, 'start-return', '2026-11-03') };
    expect(started.status).toBe('active');
    expect(started.nextDate).toBe('2026-11-03');
    const sent = { ...started, ...transitionPurchase(started, 'sent', '2026-11-10') };
    expect(sent.status).toBe('active');
    expect(purchaseDeadlines(sent)).toEqual([{ date: '2026-11-10', key: 'followUp', label: 'Check refund' }]);
    const refunded = { ...sent, ...transitionPurchase(sent, 'refund') };
    expect(refunded.status).toBe('completed');
    expect(purchaseDeadlines(refunded)).toEqual([]);
    expect(planDeviceReminders([refunded])).toEqual([]);
  });
  test('keeping drops return reminders and preserves warranty', () => {
    const kept = { ...purchase, ...transitionPurchase(purchase, 'keep') };
    expect(kept.nextDate).toBe('2027-11-01');
    expect(purchaseDeadlines(kept)).toHaveLength(1);
    const noWarranty = { ...purchase, metadata: { ...purchase.metadata, warrantyUntil: '' } };
    expect(transitionPurchase(noWarranty, 'keep').status).toBe('completed');
  });
  test('rejects skipped states and missing follow-up', () => {
    expect(() => transitionPurchase(purchase, 'refund')).toThrow();
    expect(() => transitionPurchase(purchase, 'start-return')).toThrow();
    expect(purchaseDeadlines(DEMO_ITEMS[0])).toHaveLength(1);
  });
});
