import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { planDeviceReminders } from "./reminder-plan";
import type { Item } from "./types";

export const isNativeApp = () => Capacitor.isNativePlatform();
export const reminderTime = () => typeof localStorage === 'undefined' ? '09:00' : localStorage.getItem('life-reminder-time') || '09:00';
export async function reminderPermission() { return isNativeApp() ? (await LocalNotifications.checkPermissions()).display : 'unsupported'; }
export async function testDeviceReminder() {
  if (await reminderPermission() !== 'granted') throw new Error('Notifications are not enabled');
  await LocalNotifications.schedule({ notifications: [{ id: 2147483646, title: 'LIFE reminder test', sound: 'default', body: 'LIFE test notification. Delivery depends on sound, Focus and battery settings.', schedule: { at: new Date(Date.now() + 20000) } }] });
}
let syncQueue: Promise<void> = Promise.resolve();
export function syncDeviceReminders(items: Item[]) {
  syncQueue = syncQueue.catch(() => {}).then(async () => {
    if (!isNativeApp()) return;
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel(pending);
    if (Capacitor.getPlatform() === 'android') await LocalNotifications.createChannel({ id: 'life-deadlines', name: 'Dates and return deadlines', importance: 4, visibility: 0, vibration: true });
    const notifications = planDeviceReminders(items, new Date(), reminderTime()).map(({ at, itemId, ...event }) => ({ ...event, sound: 'default', channelId: 'life-deadlines', schedule: { at }, extra: { itemId } }));
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  });
  return syncQueue;
}
export async function enableDeviceReminders(items: Item[]) {
  const result = await LocalNotifications.requestPermissions();
  if (result.display === "granted") await syncDeviceReminders(items);
  return result.display;
}
