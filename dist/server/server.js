let serverEntryPromise;
class ReminderCoordinator {
  async fetch() {
    return new Response("ok");
  }
  async alarm() {
  }
}
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./assets/server-BYXv4CDl.js").then((n) => n.a0).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
const server = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
        const clean = url.pathname.replace(/\/+$/, "") + url.search;
        return new Response(null, {
          status: 301,
          headers: {
            location: clean,
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin"
          }
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
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }
  }
};
export {
  ReminderCoordinator,
  server as default
};
