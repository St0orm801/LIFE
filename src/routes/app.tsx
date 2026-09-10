// The LIFE CLOCK app — one route, hash-driven views inside AppShell.

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppProvider } from "../lib/store";
import { AppShell, useHashRoute, type Route as AppRoute } from "../components/app-shell";
import { TodayView } from "../components/today";
import { TimelineView } from "../components/timeline";
import { ItemsView } from "../components/items";
import { ItemDetailView } from "../components/item-detail";
import { MoreView } from "../components/more";

export const Route = createFileRoute("/app")({
  component: AppPage,
});

function AppPage() {
  const [route, navigate] = useHashRoute();
  const [timelineMode, setTimelineMode] = useState<"timeline" | "calendar">("timeline");

  return (
    <AppProvider>
      <AppShell route={route} navigate={navigate}>
        {(r: AppRoute, nav) => {
          switch (r.view) {
            case "timeline":
              return (
                <TimelineView
                  mode={timelineMode}
                  setMode={setTimelineMode}
                  navigate={nav}
                />
              );
            case "calendar":
              return <TimelineView mode="calendar" setMode={setTimelineMode} navigate={nav} />;
            case "items":
              return <ItemsView navigate={nav} />;
            case "item":
              return <ItemDetailView id={r.id} navigate={nav} />;
            case "more":
              return <MoreView navigate={nav} />;
            case "add":
              return <div className="invisible" aria-hidden />;
            default:
              return <TodayView navigate={nav} />;
          }
        }}
      </AppShell>
    </AppProvider>
  );
}