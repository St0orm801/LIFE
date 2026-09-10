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

1. (Optional but recommended) rename the Worker in `app/wrangler.jsonc`:

   ```jsonc
   "name": "life-clock-prod"
   ```

2. Deploy with Wrangler:

   ```bash
   cd app
   npx wrangler deploy
   ```

   The config already wires the SSR Worker (`main: dist/server/server.js`)
   and serves static assets from `dist/client` (`assets.directory`).
   `nodejs_compat` is enabled.

3. Production domain: add a custom domain to the Worker in the Cloudflare
   dashboard (e.g. `clock.example.com`). That is it.

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