"use client";

import { useSyncExternalStore } from "react";
import type { z } from "zod";

/**
 * A typed value persisted in localStorage, shared by every component that reads it.
 * Reads are validated with zod (storage can be edited by hand); anything invalid falls back to `empty`.
 * The server always renders `empty`, so the stored value appears right after hydration.
 * ponytail: per-browser only; swap for API calls once the backend exists.
 */
export function createLocalStore<S extends z.ZodType>(key: string, schema: S, empty: z.infer<S>) {
  type T = z.infer<S>;
  let raw: string | null | undefined;
  let cache: T = empty;
  const listeners = new Set<() => void>();

  const read = (): T => {
    let next: string | null = null;
    try {
      next = window.localStorage.getItem(key);
    } catch {
      return cache; // storage blocked (private mode etc.): keep the in-memory value
    }
    if (next === raw) return cache;
    raw = next;
    try {
      const parsed = next ? schema.safeParse(JSON.parse(next)) : null;
      cache = parsed?.success ? parsed.data : empty;
    } catch {
      cache = empty;
    }
    return cache;
  };

  const write = (update: (current: T) => T) => {
    cache = update(read());
    raw = JSON.stringify(cache);
    try {
      window.localStorage.setItem(key, raw);
    } catch {
      // quota or blocked storage: the in-memory value still updates this tab
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener(); // other tabs
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  const useValue = () => useSyncExternalStore(subscribe, read, () => empty);

  return { useValue, write, read };
}
