import { useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { addDays, todayStr } from '../lib/date-utils';
import { purchaseStage, purchaseStageLabels, type PurchaseAction } from '../lib/purchase';
import type { Item } from '../lib/types';

export function PurchaseForm({ onSaved }: { onSaved: () => void }) {
  const { createItem, attachFiles } = useApp();
  const [title, setTitle] = useState('');
  const [returnBy, setReturnBy] = useState('');
  const [warranty, setWarranty] = useState('');
  const [store, setStore] = useState('');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const confirmedReturn = String(form.get('returnBy') ?? '');
    const confirmedWarranty = String(form.get('warrantyUntil') ?? '');
    if (saving.current) return;
    saving.current = true; setBusy(true); setMessage('');
    try {
      if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(confirmedReturn)) { setMessage('Enter a purchase name and a complete return deadline.'); return; }
      if (url && !/^https?:\/\//i.test(url)) { setMessage('Use a link beginning with https:// or http://.'); return; }
      const item = await createItem({ title, presetId: 'purchase', categoryId: 'warranty', actionType: 'return', nextDate: confirmedWarranty && confirmedWarranty < confirmedReturn ? confirmedWarranty : confirmedReturn, repeatRule: null,
        reminderRules: [{ offset: 3, unit: 'day', enabled: true }, { offset: 1, unit: 'day', enabled: true }],
        metadata: { purchase: true, purchaseStage: 'decide', returnBy: confirmedReturn, warrantyUntil: confirmedWarranty, store, storeUrl: url } });
      if (files.length) {
        try { await attachFiles(item.id, files, 'file'); }
        catch { window.alert('Purchase saved. Receipt could not be attached. Open the purchase and attach it again.'); }
      }
      onSaved();
    } catch { setMessage('Could not save this purchase. Try again.'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-4">
    <h2 className="text-xl font-extrabold">Track a purchase</h2>
    <p className="text-sm text-ink-2">Decide before the return deadline. Keep the receipt ready.</p>
    <label className="block">Purchase name<input className="input mt-1" required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Headphones" /></label>
    <label className="block">Return deadline<input name="returnBy" className="input mt-1" type="date" required value={returnBy} onChange={e => setReturnBy(e.target.value)} /></label>
    <p className="text-xs text-ink-2">Confirm this date from your receipt or store policy. LIFE does not determine return eligibility.</p>
    <details className="card p-4"><summary className="font-bold cursor-pointer">Receipt, warranty and store · optional</summary><div className="mt-4 space-y-4">
      <label className="block">Warranty ends<input name="warrantyUntil" className="input mt-1" type="date" value={warranty} onChange={e => setWarranty(e.target.value)} /></label>
      <label className="block">Store<input className="input mt-1" value={store} onChange={e => setStore(e.target.value)} /></label>
      <label className="block">Store or return link<input className="input mt-1" type="url" value={url} onChange={e => setUrl(e.target.value)} /></label>
      <label className="block">Receipt photo or PDF<input className="mt-2 block w-full text-sm" type="file" accept="image/*,application/pdf" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))} /></label>
      {!!files.length && <p className="text-sm">{files.length} selected · saved with this purchase</p>}
    </div></details>
    <p className="text-sm text-ink-2">Reminders: 3 days before, 1 day before and on the deadline. Enable phone notifications in More.</p>
    {message && <p role="alert" className="text-clay">{message}</p>}
    <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Save purchase'}</button>
  </form>;
}

export function PurchaseActions({ item, onChanged }: { item: Item; onChanged: () => Promise<void> }) {
  const { purchaseAction } = useApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [followUp, setFollowUp] = useState(addDays(todayStr(), 7));
  const stage = purchaseStage(item);
  const act = async (action: PurchaseAction) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await purchaseAction(item.id, action, followUp); await onChanged(); }
    catch { setMessage('Could not update this purchase. Choose a follow-up date and try again.'); }
    finally { setBusy(false); }
  };
  return <section className="card p-5 my-4 space-y-3">
    <h2 className="font-extrabold">{purchaseStageLabels[stage]}</h2>
    <p className="text-sm">Return deadline: {String(item.metadata?.returnBy ?? '')}</p>
    {Boolean(item.metadata?.warrantyUntil) && <p className="text-sm">Warranty ends: {String(item.metadata?.warrantyUntil)}</p>}
    {Boolean(item.metadata?.store) && <p className="text-sm">Store: {String(item.metadata?.store)}</p>}
    {typeof item.metadata?.storeUrl === 'string' && /^https?:\/\//i.test(item.metadata.storeUrl) && <a className="underline text-teal-deep" href={item.metadata.storeUrl} target="_blank" rel="noreferrer">Open store / return page</a>}
    {item.status === 'active' && <>
      {['decide', 'return-started', 'awaiting-refund'].includes(stage) && <label className="block text-sm">Your follow-up date<input className="input mt-1" type="date" min={todayStr()} value={followUp} onChange={e => setFollowUp(e.target.value)} /></label>}
      {stage === 'decide' && <div className="flex flex-wrap gap-2"><button disabled={busy} className="btn btn-secondary" onClick={() => void act('keep')}>Keep purchase</button><button disabled={busy || !followUp} className="btn btn-primary" onClick={() => void act('start-return')}>Start return</button></div>}
      {stage === 'return-started' && <button disabled={busy || !followUp} className="btn btn-primary" onClick={() => void act('sent')}>Sent / handed back · await refund</button>}
      {stage === 'awaiting-refund' && <button disabled={busy} className="btn btn-primary" onClick={() => void act('refund')}>Confirm refund received</button>}
      <p className="text-xs text-ink-2">Records your actions. LIFE does not submit returns or confirm bank payments.</p>
    </>}
    {message && <p role="alert">{message}</p>}
  </section>;
}
