"use client";

import { ListStateSchema, type ListEntry, type ListStatus } from "@/data/schema";
import { api, isRemote } from "./api";
import { createLocalStore } from "./local-store";

// The user's list with a status per title. Same pattern as progress: browser store for instant UI, API when signed in.
const EMPTY: { entries: ListEntry[] } = { entries: [] };
const store = createLocalStore("mugenkai:list", ListStateSchema, EMPTY);

export const useList = () => store.useValue().entries;
export const useListStatus = (seriesId: string) => useList().find((e) => e.seriesId === seriesId)?.status;

/** Sets a title's status (moving it to the top), or removes it with `null`. */
export function setListStatus(seriesId: string, status: ListStatus | null) {
  store.write((s) => {
    const rest = s.entries.filter((e) => e.seriesId !== seriesId);
    return { entries: status ? [{ seriesId, status }, ...rest] : rest };
  });
  if (isRemote()) {
    const path = `/api/list/${encodeURIComponent(seriesId)}`;
    void (status ? api(path, { method: "PUT", body: { status } }) : api(path, { method: "DELETE", body: {} })).catch((err) =>
      console.warn("list sync failed", err),
    );
  }
}

/** Quick "+" on cards: add as Planning, or remove. */
export function toggleList(seriesId: string) {
  const inList = store.read().entries.some((e) => e.seriesId === seriesId);
  setListStatus(seriesId, inList ? null : "PLANNING");
}

/** On sign-in: push local additions, then adopt the account's list. */
export async function syncListWithAccount() {
  const local = store.read().entries;
  const { entries } = await api<{ entries: ListEntry[] }>("/api/list");
  const known = new Set(entries.map((e) => e.seriesId));
  const missing = local.filter((e) => !known.has(e.seriesId));
  await Promise.all(
    missing.map((e) => api(`/api/list/${encodeURIComponent(e.seriesId)}`, { method: "PUT", body: { status: e.status } }).catch(() => {})),
  );
  store.write(() => ({ entries: [...missing, ...entries] }));
}

export const clearLocalList = () => store.write(() => EMPTY);

/** Status names; "CURRENT" reads as Watching or Reading depending on the medium. */
export function listLabel(status: ListStatus, kind: "anime" | "manga") {
  if (status === "CURRENT") return kind === "anime" ? "Watching" : "Reading";
  return { PLANNING: "Planning", COMPLETED: "Completed", PAUSED: "Paused", DROPPED: "Dropped" }[status];
}
