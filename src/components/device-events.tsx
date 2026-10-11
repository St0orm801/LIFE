import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { useApp } from "../lib/store";
import { isNativeApp, syncDeviceReminders } from "../lib/device-reminders";

export function DeviceEvents() {
  const { items, ready } = useApp();
  useEffect(() => {
    if (ready) void syncDeviceReminders(items).catch(() => {});
    if (!isNativeApp()) return;
    const resume = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive && ready) void syncDeviceReminders(items).catch(() => {});
    });
    return () => { void resume.then(handle => handle.remove()); };
  }, [ready, items]);
  useEffect(() => {
    if (!isNativeApp()) return;
    const taps = LocalNotifications.addListener("localNotificationActionPerformed", event => {
      const id = event.notification.extra?.itemId;
      if (typeof id === "string") window.location.hash = `#/item/${encodeURIComponent(id)}`;
    });
    const back = App.addListener("backButton", () => {
      if (window.location.hash && window.location.hash !== "#/today") window.location.hash = "#/today";
      else void App.minimizeApp();
    });
    return () => { void taps.then(handle => handle.remove()); void back.then(handle => handle.remove()); };
  }, []);
  return null;
}
