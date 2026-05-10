"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getFeedsSnapshot,
  getServerFeedsSnapshot,
  saveFeeds,
  subscribeFeeds,
  type StoredFeed,
} from "@/lib/feeds-storage";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useFeeds() {
  const feeds = useSyncExternalStore(
    subscribeFeeds,
    getFeedsSnapshot,
    getServerFeedsSnapshot,
  );

  const addFeed = useCallback(
    (feed: Omit<StoredFeed, "id" | "createdAt">): StoredFeed => {
      const entry: StoredFeed = {
        ...feed,
        id: newId(),
        createdAt: Date.now(),
      };
      const prev = getFeedsSnapshot();
      const next = [entry, ...prev.filter((f) => f.url !== entry.url)];
      saveFeeds(next);
      return entry;
    },
    [],
  );

  const removeFeed = useCallback((id: string) => {
    const prev = getFeedsSnapshot();
    saveFeeds(prev.filter((f) => f.id !== id));
  }, []);

  const updateFeedTitle = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const prev = getFeedsSnapshot();
    saveFeeds(
      prev.map((f) => (f.id === id ? { ...f, title: trimmed } : f)),
    );
  }, []);

  return {
    feeds,
    addFeed,
    removeFeed,
    updateFeedTitle,
  };
}
