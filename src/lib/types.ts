// LIFE CLOCK — core domain model.
// Everything in the product is an Item that lives through time with one
// canonical NEXT DATE. History, reminders and attachments hang off it.

export type DateStr = string; // "YYYY-MM-DD", date-only, local — never UTC-shifted

export type ActionType =
  | "expires"
  | "renews"
  | "replace"
  | "service"
  | "birthday"
  | "anniversary"
  | "best-before"
  | "due"
  | "pay"
  | "return"
  | "review"
  | "check"
  | "renew-license"
  | "refill"
  | "custom";

export type LifeStatus = "active" | "completed" | "archived";

// Derived view status — computed on demand, never stored.
export type ViewStatus =
  | "active"
  | "due-soon"
  | "today"
  | "overdue"
  | "expired"
  | "completed"
  | "archived";

export type RepeatKind = "none" | "yearly" | "monthly" | "every-n-months" | "weekly";

export interface RepeatRule {
  kind: RepeatKind;
  /** Months for every-n-months */
  every?: number;
}

export interface ReminderRule {
  offset: number;
  unit: "day" | "week" | "month";
  enabled: boolean;
}

export type AttachmentKind = "photo" | "file";

export interface AttachmentMeta {
  id: string;
  kind: AttachmentKind;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
}

export interface Item {
  id: string;
  title: string;
  categoryId: string;
  presetId: string;
  actionType: ActionType;
  /** Canonical next important date ("YYYY-MM-DD"). Reminders derive from it. */
  nextDate: DateStr;
  /** "MM-DD" for yearless dates (birthdays, anniversaries). */
  monthDay?: string;
  repeatRule: RepeatRule | null;
  reminderRules: ReminderRule[];
  /** Yearly items roll to next year automatically (birthdays, anniversaries). */
  autoRoll?: boolean;
  status: LifeStatus;
  notes?: string;
  attachments: AttachmentMeta[];
  /** Future module data (food barcode, vehicle, home). Not part of core shape. */
  metadata?: Record<string, string | number | boolean>;
  amount?: number | null;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
  completedAt?: number;
}

export type HistoryType =
  | "created"
  | "date-changed"
  | "renewed"
  | "replaced"
  | "serviced"
  | "consumed"
  | "discarded"
  | "completed"
  | "paid"
  | "returned"
  | "archived"
  | "restored"
  | "auto-advanced"
  | "edited";

export interface HistoryEvent {
  id: string;
  itemId: string;
  type: HistoryType;
  /** Epoch ms when the event happened. */
  date: number;
  oldDate?: DateStr;
  newDate?: DateStr;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
  icon: string; // Phosphor icon name
  /** Muted brand color token (css var) — category chips, dots, accents. */
  color: string;
  /** Shown on the first Add screen; the rest live behind "More". */
  major: boolean;
  order: number;
}

export type OptionalField =
  | "custom-title"
  | "custom-reminders"
  | "repeat"
  | "notes"
  | "photo"
  | "file"
  | "amount";

export interface LifecycleVerb {
  /** Label of the primary lifecycle button, e.g. "Renew" / "Replaced". */
  action: string;
  /** History type written when the action is applied. */
  historyType: HistoryType;
  /** Secondary actions, e.g. Food → Discarded. */
  secondary?: { action: string; historyType: HistoryType };
}

export interface Preset {
  id: string;
  categoryId: string;
  name: string;
  actionType: ActionType;
  /** Label for the date field, e.g. "Expiry date" / "Next replacement". */
  dateLabel: string;
  /** Required title field label (e.g. "Item name", "Who?"). Null when the preset name is the title. */
  titleLabel?: string;
  /** Default reminder offsets in days, before nextDate. */
  defaultReminders: number[];
  /** Default recurrence (furnace filter → every 3 months, birthday → yearly). */
  defaultRepeat?: RepeatRule;
  lifecycle: LifecycleVerb;
  aliases: string[];
  popular?: boolean;
  /** Extra fields the preset may use, always optional. */
  optionalFields: OptionalField[];
  /** Food category skips the standard form for its own flow. */
  special?: "food";
}