# LIFE CLOCK — standalone Cloudflare deployment

LIFE CLOCK is deliberately local-first: all data lives in the visitor's
browser (IndexedDB), so a deployment is just one Worker + static assets.
No database, no account, no external runtime dependency.

## Stack

- React 19 + TanStack Start, SSR in ONE Cloudflare Worker.
- Build: Vite 7 + bun (or Node ≥ 20).
- Data: client-side IndexedDB only (repository abstraction ready for a
  future D1 + R2 backend — nothing is required now).

## Build

```bash
cd app
bun install        # or: npm install
bun run build      # type-check + emit dist/server + dist/client
```

## Deploy to Cloudflare

### Option A — from your machine (simplest)

1. (Optional but recommended) rename the Worker in `app/wrangler.jsonc`:

   ```jsonc
   "name": "life-clock-prod"
   ```

2. Build + deploy:

   ```bash
   cd app
   bun install        # or: npm install
   bun run deploy     # type-check + build + npx wrangler deploy
   ```

   The `deploy` script runs the build first, so `dist/server/server.js`
   always exists before `wrangler deploy` reads it. The config already wires
   the SSR Worker (`main: dist/server/server.js`) and serves static assets
   from `dist/client` (`assets.directory`). `nodejs_compat` is enabled.

3. Production domain: add a custom domain to the Worker in the Cloudflare
   dashboard (e.g. `clock.example.com`). That is it.

### Option B — Cloudflare Builds (git-connected CI)

If you connected your repository to Cloudflare's automated builds, the
pipeline runs **install → build → deploy** in that order. Two settings are
required so the deploy step does not run before the build:

- **Root directory**: `app`
- **Build command**: `bun run build` (or `npm run build`)
- **Deploy command**: `npx wrangler deploy`

The build emits `dist/server/server.js` + `dist/client`; the deploy command
then uploads the Worker and its assets. Without the build command, Wrangler
fails with `The entry-point file at "dist/server/server.js" was not found`
(because nothing generated it yet).

## Local preview

```bash
cd app
bun run dev        # dev server with SSR
bun test           # 36 unit/integration/screen tests
```

## Notes

- `wrangler.jsonc` carries placeholder name/bindings blocks used by the
  Higgsfield build pipeline; for a standalone deploy only `name` matters.
- No secrets or environment variables are required.
- Data never leaves the browser. A JSON backup/restore lives in the app's
  More screen; `.ics` calendar export is also built in.