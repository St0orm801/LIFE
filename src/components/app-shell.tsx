// App shell: mobile bottom nav (TODAY | TIMELINE | ADD | ITEMS | MORE) and
// desktop sidebar. A tiny hash router keeps views shareable and back-friendly
// without extra deps: #/today #/timeline #/calendar #/items #/item/<id> #/add #/more

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChartLineUp,
  House,
  Plus,
  SquaresFour,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { AddFlow } from "./add-flow";
import { createPortal } from "react-dom";

export type Route =
  | { view: "today" }
  | { view: "timeline" }
  | { view: "calendar" }
  | { view: "items" }
  | { view: "item"; id: string }
  | { view: "add" }
  | { view: "more" };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  const [head, ...rest] = h.split("/");
  switch (head) {
    case "timeline": return { view: "timeline" };
    case "calendar": return { view: "calendar" };
    case "items": return { view: "items" };
    case "item": return { view: "item", id: rest.join("/") || "unknown" };
    case "add": return { view: "add" };
    case "more": return { view: "more" };
    default: return { view: "today" };
  }
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? { view: "today" } : parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    let h = "#/today";
    switch (r.view) {
      case "timeline": h = "#/timeline"; break;
      case "calendar": h = "#/calendar"; break;
      case "items": h = "#/items"; break;
      case "item": h = `#/item/${encodeURIComponent(r.id)}`; break;
      case "add": h = "#/add"; break;
      case "more": h = "#/more"; break;
      default: h = "#/today";
    }
    if (window.location.hash === h) {
      setRoute(r);
      return;
    }
    window.location.hash = h;
  }, []);

  return [route, navigate];
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white"
      >
        <ChartLineUp size={20} weight="bold" />
      </div>
      <div className="leading-tight">
        <div className="text-[0.98rem] font-extrabold tracking-tight text-ink">LIFE CLOCK</div>
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
          next date
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS: Array<{ key: Route["view"]; label: string; icon: typeof House }> = [
  { key: "today", label: "Today", icon: House },
  { key: "timeline", label: "Timeline", icon: ChartLineUp },
  { key: "items", label: "Items", icon: SquaresFour },
  { key: "more", label: "More", icon: SlidersHorizontal },
];

export function AppShell({
  route,
  navigate,
  children,
}: {
  route: Route;
  navigate: (r: Route) => void;
  children: (r: Route, navigate: (r: Route) => void) => ReactNode;
}) {
  const isAdd = route.view === "add";
  const activeKey = route.view === "item" ? "items" : route.view === "calendar" ? "timeline" : route.view;

  const content = useMemo(() => children(route, navigate), [children, route, navigate]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl md:flex md:gap-0">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col gap-2 border-r border-line bg-paper px-4 py-6 md:flex md:w-60 lg:w-64">
        <div className="mb-4 px-2">
          <BrandMark />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV_ITEMS.map((n) => (
            <button
              key={n.key}
              onClick={() => navigate({ view: n.key } as Route)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-bold transition-colors ${
                activeKey === n.key ? "bg-teal-tint text-teal-deep" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              <n.icon size={20} weight={activeKey === n.key ? "fill" : "regular"} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <button onClick={() => navigate({ view: "add" })} className="btn btn-primary btn-block">
            <Plus size={18} weight="bold" />
            Add item
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <main className="app-main mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-7">
          {content}
        </main>

        {/* Mobile bottom nav */}
        {typeof document !== "undefined" && createPortal(<nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur safe-bottom md:hidden"
        >
          <div className="mx-auto flex max-w-md items-end justify-between px-4 pb-1.5 pt-1.5">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.key}
                onClick={() => navigate({ view: n.key } as Route)}
                aria-current={activeKey === n.key ? "page" : undefined}
                className={`nav-item ${activeKey === n.key ? "nav-item-active" : ""}`}
              >
                <n.icon size={22} weight={activeKey === n.key ? "fill" : "regular"} />
                {n.label}
              </button>
            ))}
            <button type="button" className="nav-add" onClick={() => navigate({ view: "add" })} aria-label="Add item">
              <Plus size={26} weight="bold" />
            </button>
          </div>
        </nav>, document.body)}
      </div>

      {/* Add flow overlays the app (modal) */}
      {isAdd ? (
        <div className="fixed inset-0 z-50 md:pl-60 lg:pl-64">
          <AddFlow onClose={() => navigate({ view: "today" })} />
        </div>
      ) : null}
    </div>
  );
}
