// Web notifications — honest capability: works while the app is open in the
// browser. No fake native calendar alarms. Backend/email/push come with the
// future Cloudflare phase.

let granted = false;

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  const p = await Notification.requestPermission();
  granted = p === "granted";
  return p;
}

/** Fire a reminder notification when permissions allow. Never throws. */
export function notify(title: string, body: string): void {
  try {
    if (!notificationsSupported()) return;
    if (Notification.permission !== "granted") return;
    if (document.visibilityState === "visible" && !document.hasFocus()) {
      // The user is looking at another tab — a notification is still useful.
    }
    const n = new Notification(title, { body, tag: "life-clock-reminder" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* notifications are best-effort */
  }
}

export function isGranted(): boolean {
  return notificationsSupported() && Notification.permission === "granted";
}