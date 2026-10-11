import { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useApp } from '../lib/store';
import { enableDeviceReminders, isNativeApp, reminderPermission, reminderTime, syncDeviceReminders, testDeviceReminder } from '../lib/device-reminders';
const PhoneAlarm = registerPlugin<{ open(options: { hour: number; minute: number }): Promise<void> }>('PhoneAlarm');

export function PhoneReminders() {
  const { items } = useApp();
  const [permission, setPermission] = useState('checking');
  const [time, setTime] = useState(reminderTime);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void reminderPermission().then(setPermission).catch(() => setPermission('unavailable')); }, []);
  if (!isNativeApp()) return null;
  const run = async (test: boolean) => {
    setBusy(true);
    try {
      if (test) { await testDeviceReminder(); setMessage('Test scheduled for 20 seconds from now. Lock your phone to check delivery.'); }
      else { const state = await enableDeviceReminders(items); setPermission(state); setMessage(state === 'granted' ? 'Phone reminders enabled.' : 'Enable notifications for LIFE in your phone settings.'); }
    } catch { setMessage('Could not schedule notifications. Check phone permissions and try again.'); }
    finally { setBusy(false); }
  };
  return <section className="card p-5 space-y-3"><h2 className="font-extrabold">Phone notifications</h2><p className="text-sm">Permission: {permission}. Reminders can arrive when the app is closed.</p>
    <label className="block text-sm">Daily reminder time<input className="input mt-1" type="time" value={time} onChange={e => { const next = e.target.value; if (!next) return; setTime(next); localStorage.setItem('life-reminder-time', next); void syncDeviceReminders(items).catch(() => setMessage('Could not refresh reminders. Try again.')); }} /></label>
    <button className="btn btn-primary" disabled={busy} onClick={() => void run(false)}>Enable phone notifications</button>{' '}
    <button className="btn btn-secondary" disabled={busy || permission !== 'granted'} onClick={() => void run(true)}>Test notification</button>
    <p className="text-xs text-ink-2">Up to 60 upcoming reminders. Sound and delivery follow your phone settings. This version uses notifications, not a full-screen alarm clock.</p>{message && <p role="status" className="text-sm">{message}</p>}
    {Capacitor.getPlatform() === 'android' && <div className="space-y-2"><button className="btn btn-secondary" onClick={() => { const [hour, minute] = time.split(':').map(Number); void PhoneAlarm.open({ hour, minute }).catch(() => setMessage('Open your phone Clock app to set an alarm.')); }}>Open phone alarm setup</button><p className="text-xs text-ink-2">Opens your Clock app at the selected time. Review its next ringing time and confirm there. This alarm is separate from event dates and is managed in Clock.</p></div>}
  </section>;
}
