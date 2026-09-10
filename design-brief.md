# LIFE CLOCK — design brief

- **Design read**: a calm premium utility for people who juggle real-life dates
  (documents, bills, birthdays, food, maintenance). Warm, quiet, trustworthy;
  the product is a calendar, not a dashboard.
- **Concept spine**: "one clear place" — a paper-like desk where every
  important date sits in plain sight, with plain words ("Expires in 45 days",
  not status jargon).
- **Delivery tier**: `editorial` — micro-motion only; the hero's signature
  element is a real interactive month calendar with labeled sample data
  (product preview, not an animation).
- **Animation mode**: non-animated — the brief explicitly prescribes a calm
  utility with "small, purposeful transitions", bans autoplay video and
  distracting animations, and demands a "real interface preview"; the
  interactive preview is the Tier-1 mechanic and responds to the user's input.
- **Locked palette** (with defense):
  - paper `#F7F5F0` (warm off-white per brief), surface `#FFFFFF`,
    surface-2 `#EFEDE6`, line `#E4E0D5`
  - ink `#26241F` (deep charcoal per brief), ink-2 `#57534B`, ink-3 `#8A857A`
  - teal `#2F7E78` / teal-deep `#27645F` / teal-tint `#E4EFED` (muted teal
    primary per brief)
  - warn `#B4473A` (reserved for genuinely overdue states only)
  - category colors: documents `#2F7E78`, subscriptions `#5B6FA8`, birthdays
    `#A97B3E`, food `#6E8F4E`, health `#A55B78`, home & auto `#69798F`,
    other `#8A8274` (subtle, muted)
  - Banned-family check: warm cream + muted teal is not graphite/orange,
    not near-black/neon, not cream/brass/oxblood; distinct from previous chat
    builds; no AI purple.
- **Locked type**: Manrope Variable (display + UI, weights 400-800); wordmark
  is a simple clock-ring glyph + letterspaced caps. No serif.
- **Radius system**: cards/surfaces 16px, inputs 10px, interactive pills
  (999px). One documented scale.
- **Section plan** (marketing): nav → split hero (copy + live preview) →
  3-step "how it works" (cards) → examples (category grid, labeled sample
  dates) → features (hairline list, no cards) → pricing (only when owner
  configures real prices) → final CTA → footer. Eyebrows: 0.
- **Asset plan**: launch branding scene (calm paper flat-lay) + flat clock
  icon via generate_app_branding; live preview calendar as the built-in hero
  visual; no stock imagery.
- **CTA inventory**: "Get started" (signup intent, nav + hero + footer
  repeat), "Try demo" (demo intent, hero + examples + footer), "Sign in"
  (auth intent). Each has its own garment: solid teal pill, bordered pill,
  text link.
- **Product architecture**: single Worker app (TanStack Start, SSR), one D1
  database, R2 for private attachments, one Durable Object for the
  server-side reminder scheduler; in-app email/password auth with hashed
  sessions; shared deadline engine (expiration / payment / occasion / action);
  isolated demo account; Stripe boundary gated on owner config.