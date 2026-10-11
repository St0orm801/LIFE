import type { Item } from './types';

export type PurchaseStage = 'decide' | 'kept' | 'return-started' | 'awaiting-refund' | 'refunded';
export type PurchaseAction = 'keep' | 'start-return' | 'sent' | 'refund';
export const purchaseStageLabels: Record<PurchaseStage, string> = {
  decide: 'Decide: keep or return', kept: 'Keeping · warranty tracking',
  'return-started': 'Return started', 'awaiting-refund': 'Waiting for refund', refunded: 'Refund confirmed',
};
export function isPurchase(item: Item) { return item.metadata?.purchase === true; }
export function purchaseStage(item: Item): PurchaseStage {
  const stage = item.metadata?.purchaseStage;
  return typeof stage === 'string' && Object.hasOwn(purchaseStageLabels, stage) ? stage as PurchaseStage : 'decide';
}
export function purchaseDeadlines(item: Item): Array<{ date: string; label: string; key: string }> {
  if (!isPurchase(item)) return [{ date: item.nextDate, label: 'Next date', key: 'next' }];
  const m = item.metadata!;
  const stage = purchaseStage(item);
  const dates: Array<{ date: string; label: string; key: string }> = [];
  const add = (key: string, label: string) => {
    const date = m[key];
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) dates.push({ date, label, key });
  };
  if (stage === 'decide') { add('returnBy', 'Decide before return deadline'); add('warrantyUntil', 'Warranty ends'); }
  if (stage === 'kept') add('warrantyUntil', 'Warranty ends');
  if (stage === 'return-started') add('followUp', 'Check return progress');
  if (stage === 'awaiting-refund') add('followUp', 'Check refund');
  return dates.sort((a, b) => a.date.localeCompare(b.date));
}
export function transitionPurchase(item: Item, action: PurchaseAction, followUp?: string): Partial<Item> {
  if (!isPurchase(item) || item.status !== 'active') throw new Error('Purchase is not active');
  const stage = purchaseStage(item);
  const allowed: Record<PurchaseAction, PurchaseStage> = { keep: 'decide', 'start-return': 'decide', sent: 'return-started', refund: 'awaiting-refund' };
  if (allowed[action] !== stage) throw new Error('Invalid purchase transition');
  if ((action === 'start-return' || action === 'sent') && (!followUp || !/^\d{4}-\d{2}-\d{2}$/.test(followUp))) throw new Error('Choose a follow-up date');
  const nextStage: Record<PurchaseAction, PurchaseStage> = { keep: 'kept', 'start-return': 'return-started', sent: 'awaiting-refund', refund: 'refunded' };
  const metadata = { ...item.metadata, purchaseStage: nextStage[action], ...(followUp ? { followUp } : {}) };
  const next = { ...item, metadata };
  const deadline = purchaseDeadlines(next)[0];
  return { metadata, nextDate: deadline?.date ?? item.nextDate, actionType: action === 'keep' ? 'expires' : 'check', status: deadline ? 'active' : 'completed', ...(deadline ? { completedAt: undefined } : { completedAt: Date.now() }) };
}
