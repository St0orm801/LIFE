// Preset library search — partial matches, aliases, synonyms. Tolerant of
// spelling differences, never requires knowing category names.

import { PRESETS, CATEGORY_BY_ID } from "./presets";
import type { Preset } from "./types";

const SYNONYMS: Record<string, string[]> = {
  licence: ["license", "licence", "lic", "dl"],
  insurance: ["ins", "coverage", "policy"],
  car: ["auto", "vehicle"],
  subscription: ["sub", "plan", "membership"],
  warranty: ["guarantee", "coverage"],
  filter: ["filters"],
  birthday: ["bday", "birth", "b-day"],
  passport: ["pass port", "pp"],
  expiry: ["expiration", "expires", "exp"],
  renewal: ["renewals", "renew", "renewing"],
  payment: ["pay", "bill", "due"],
  vaccination: ["vaccine", "shot", "immunization"],
  prescription: ["rx", "script", "meds"],
  medication: ["medicine", "drug", "meds"],
  maintenance: ["maint", "service", "servicing"],
  registration: ["reg", "plate", "sticker"],
  driver: ["driving", "dl", "license"],
  home: ["house", " residence"],
  phone: ["mobile", "cell"],
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function tokenize(s: string): string[] {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

function scorePreset(preset: Preset, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(preset.name);
  const category = CATEGORY_BY_ID[preset.categoryId];
  const categoryName = normalize(category?.name ?? "");
  const aliasText = preset.aliases.map(normalize).join(" ");

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (name.includes(q)) return 80;
  if (aliasText.includes(q)) return 75;

  const qTokens = tokenize(q);
  const nameTokens = tokenize(name);
  let hits = 0;
  for (const t of qTokens) {
    if (nameTokens.some((nt) => nt.startsWith(t) || t.startsWith(nt))) hits += 1;
    else if (preset.aliases.some((a) => normalize(a).includes(t))) hits += 0.8;
    else if (categoryName.includes(t)) hits += 0.4;
  }
  if (hits === 0) return 0;
  return Math.min(70, 20 + hits * 14);
}

/** Ranked preset search across name, aliases, category, with synonyms. */
export function searchPresets(query: string, limit = 24): Preset[] {
  const q = normalize(query);
  if (!q) return [];
  // Expand query with synonyms, but score against BOTH the raw query and the
  // expanded one and keep the best score — expansion must never beat an exact
  // or near match on the user's actual words (e.g. "passport" > "parking pass").
  let expanded = q;
  for (const [word, synonyms] of Object.entries(SYNONYMS)) {
    if (q.includes(word)) {
      expanded += " " + synonyms.join(" ");
    }
  }
  return PRESETS.map((p) => ({ p, score: Math.max(scorePreset(p, q), scorePreset(p, expanded)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Fuzzy item search across titles + presets + categories. */
export function searchItems<T extends { title: string; categoryId: string; presetId: string }>(
  items: T[],
  query: string,
  presetsById: Record<string, Preset>,
): T[] {
  const q = normalize(query);
  if (!q) return items;
  return items.filter((it) => {
    const title = normalize(it.title);
    if (title.includes(q)) return true;
    const p = presetsById[it.presetId];
    if (!p) return false;
    return (
      normalize(p.name).includes(q) ||
      p.aliases.some((a) => normalize(a).includes(q)) ||
      normalize(CATEGORY_BY_ID[it.categoryId]?.shortName ?? "").includes(q)
    );
  });
}