// Shared UI primitives — icons, pills, sheets, empty states, date input.

import {
  Airplane,
  Briefcase,
  Car,
  Check,
  CurrencyCircleDollar,
  DotsThree,
  ForkKnife,
  Heart,
  House,
  IdentificationBadge,
  IdentificationCard,
  Package,
  PawPrint,
  ShieldCheck,
  Users,
  X,
} from "@phosphor-icons/react";
import type { JSX } from "react";
import { CATEGORY_BY_ID } from "../lib/presets";
import type { Category } from "../lib/types";
import { deriveStatus, statusMeta } from "../lib/status";
import type { Item, ViewStatus } from "../lib/types";

export function CategoryIcon({ categoryId, size = 20 }: { categoryId: string; size?: number }) {
  const cat = CATEGORY_BY_ID[categoryId] ?? CATEGORY_BY_ID.other;
  const Icon = iconFor(cat);
  return <Icon size={size} weight="duotone" />;
}

function iconFor(cat: Category) {
  switch (cat.icon) {
    case "IdentificationCard": return IdentificationCard;
    case "Airplane": return Airplane;
    case "CurrencyCircleDollar": return CurrencyCircleDollar;
    case "ShieldCheck": return ShieldCheck;
    case "House": return House;
    case "Car": return Car;
    case "Users": return Users;
    case "Heart": return Heart;
    case "ForkKnife": return ForkKnife;
    case "PawPrint": return PawPrint;
    case "Briefcase": return Briefcase;
    case "IdentificationBadge": return IdentificationBadge;
    case "Package": return Package;
    default: return DotsThree;
  }
}

export function StatusPill({ status }: { status: ViewStatus }) {
  const meta = statusMeta(status);
  return (
    <span className={`pill pill-${meta.tone}`}>
      {status === "today" ? <Check size={12} weight="bold" /> : null}
      {meta.label}
    </span>
  );
}

export function ItemStatusPill({ item }: { item: Item }) {
  return <StatusPill status={deriveStatus(item)} />;
}

export function catColor(categoryId: string): string {
  return `var(--color-cat-${categoryId})`;
}

export function CatDot({ categoryId, size = 8 }: { categoryId: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ background: catColor(categoryId), width: size, height: size }}
      className="inline-block rounded-full shrink-0"
    />
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: JSX.Element;
  title: string;
  hint?: string;
  action?: JSX.Element;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-ink-3">{icon}</div> : null}
      <p className="text-[0.99rem] font-bold text-ink">{title}</p>
      {hint ? <p className="mt-1 max-w-xs text-[0.85rem] text-ink-3">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function CloseIcon() {
  return <X size={22} />;
}