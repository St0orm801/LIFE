let serverEntryPromise: Promise<{ fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response }> | undefined;

// Inert Durable Object retained for Cloudflare class-name continuity with the
// previous build (removing a DO class requires a delete-class migration on the
// platform run). It performs no work: LIFE CLOCK v2 is local-first — reminders
// are computed in the browser, and server-side reminders belong to the future
// cloud phase where this class can be re-activated.
export class ReminderCoordinator {
  async fetch(): Promise<Response> {
    return new Response("ok");
  }
  async alarm(): Promise<void> {
    /* no-op in local-first build */
  }
}

async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response },
    );
  }
  return serverEntryPromise;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // SEO hygiene: no trailing slashes (301 to the clean path).
      const url = new URL(request.url);
      if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
        const clean = url.pathname.replace(/\/+$/, "") + url.search;
        return new Response(null, {
          status: 301,
          headers: {
            location: clean,
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
          },
        });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const headers = new Headers(response.headers);
      if (!headers.has("x-content-type-options")) headers.set("x-content-type-options", "nosniff");
      if (!headers.has("referrer-policy")) headers.set("referrer-policy", "strict-origin-when-cross-origin");
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      console.error(error);
      return new Response("<h1>Something went wrong</h1>", {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};