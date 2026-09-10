// Tiny external store + React glue for the app. Kept dependency-free:
// a plain listener set + useSyncExternalStore.

import { useSyncExternalStore } from "react";

export interface StoreShape<T> {
  get: () => T;
  set: (updater: (prev: T) => T) => void;
  subscribe: (fn: () => void) => () => void;
}

export function createStore<T>(initial: T): StoreShape<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (updater) => {
      state = updater(state);
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function useStore<T, S>(store: StoreShape<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

export function uid(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}