"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getFeedsSnapshot,
  getServerFeedsSnapshot,
  saveFeeds,
  subscribeFeeds,
  updateLibrary,
  getLibrarySnapshot,
  newLocalId,
  type StoredFeed,
} from "@/lib/reader-library-storage";

function mapRemoteToStored(row: {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  folderId?: string | null;
}): StoredFeed {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    createdAt: row.createdAt,
    folderId: row.folderId ?? null,
  };
}

export function useFeeds() {
  const { isSignedIn, isLoaded } = useAuth();

  const localFeeds = useSyncExternalStore(
    subscribeFeeds,
    getFeedsSnapshot,
    getServerFeedsSnapshot,
  );

  const localFeedCount = useSyncExternalStore(
    subscribeFeeds,
    () => getFeedsSnapshot().length,
    () => 0,
  );

  const [remoteFeeds, setRemoteFeeds] = useState<StoredFeed[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const loadRemote = useCallback(async () => {
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const res = await fetch("/api/subscriptions", { cache: "no-store" });
      if (res.status === 401) {
        setRemoteFeeds([]);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `加载失败 (${res.status})`);
      }
      const rows = (await res.json()) as {
        id: string;
        url: string;
        title: string;
        createdAt: number;
        folderId?: string | null;
      }[];
      setRemoteFeeds(rows.map(mapRemoteToStored));
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : "加载失败");
      setRemoteFeeds([]);
    } finally {
      setRemoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const timer = window.setTimeout(() => {
      void loadRemote();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoaded, isSignedIn, loadRemote]);

  const feeds = useMemo(() => {
    if (!isLoaded) return [];
    if (isSignedIn) return remoteFeeds;
    return localFeeds;
  }, [isLoaded, isSignedIn, remoteFeeds, localFeeds]);

  const addFeed = useCallback(
    async (feed: Omit<StoredFeed, "id" | "createdAt">): Promise<StoredFeed> => {
      if (!isLoaded) {
        throw new Error("认证状态加载中，请稍后再试");
      }
      if (isSignedIn) {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: feed.url,
            title: feed.title,
            folderId: feed.folderId ?? undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          id?: string;
          url?: string;
          title?: string;
          createdAt?: number;
          folderId?: string | null;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "添加失败");
        }
        const entry = mapRemoteToStored(
          data as {
            id: string;
            url: string;
            title: string;
            createdAt: number;
            folderId?: string | null;
          },
        );
        setRemoteFeeds((prev) => {
          const filtered = prev.filter((f) => f.url !== entry.url);
          return [entry, ...filtered];
        });
        return entry;
      }

      const entry: StoredFeed = {
        ...feed,
        id: newLocalId(),
        createdAt: Date.now(),
        folderId: feed.folderId ?? null,
      };
      const prev = getFeedsSnapshot();
      const next = [entry, ...prev.filter((f) => f.url !== entry.url)];
      saveFeeds(next);
      return entry;
    },
    [isLoaded, isSignedIn],
  );

  const removeFeed = useCallback(
    async (id: string) => {
      if (!isLoaded) return;
      if (isSignedIn) {
        const res = await fetch(
          `/api/subscriptions/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        if (!res.ok && res.status !== 404) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "删除失败");
        }
        setRemoteFeeds((prev) => prev.filter((f) => f.id !== id));
        return;
      }
      updateLibrary((prev) => ({
        ...prev,
        feeds: prev.feeds.filter((f) => f.id !== id),
        readerItems: prev.readerItems.filter((r) => r.subscriptionId !== id),
      }));
    },
    [isLoaded, isSignedIn],
  );

  const updateFeedTitle = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      if (!isLoaded) return;
      if (isSignedIn) {
        const res = await fetch(
          `/api/subscriptions/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: trimmed }),
          },
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "更新失败");
        }
        setRemoteFeeds((prev) =>
          prev.map((f) => (f.id === id ? { ...f, title: trimmed } : f)),
        );
        return;
      }
      const prev = getLibrarySnapshot();
      saveFeeds(
        prev.feeds.map((f) => (f.id === id ? { ...f, title: trimmed } : f)),
      );
    },
    [isLoaded, isSignedIn],
  );

  const updateFeedFolder = useCallback(
    async (id: string, folderId: string | null) => {
      if (!isLoaded) return;
      if (isSignedIn) {
        const res = await fetch(
          `/api/subscriptions/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId }),
          },
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "更新失败");
        }
        setRemoteFeeds((prev) =>
          prev.map((f) => (f.id === id ? { ...f, folderId } : f)),
        );
        return;
      }
      const prev = getLibrarySnapshot();
      saveFeeds(
        prev.feeds.map((f) =>
          f.id === id ? { ...f, folderId } : f,
        ),
      );
    },
    [isLoaded, isSignedIn],
  );

  const importLocalFeedsToCloud = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      return { imported: 0, skipped: 0, failed: 0 };
    }
    const local = getFeedsSnapshot();
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    for (const f of local) {
      try {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: f.url, title: f.title }),
        });
        if (res.status === 201) imported++;
        else if (res.status === 409) skipped++;
        else failed++;
      } catch {
        failed++;
      }
    }
    await loadRemote();
    return { imported, skipped, failed };
  }, [isLoaded, isSignedIn, loadRemote]);

  return {
    feeds,
    addFeed,
    removeFeed,
    updateFeedTitle,
    updateFeedFolder,
    importLocalFeedsToCloud,
    feedSource: isLoaded && isSignedIn ? ("cloud" as const) : ("local" as const),
    cloudLoading: Boolean(isLoaded && isSignedIn && remoteLoading),
    cloudError: isLoaded && isSignedIn ? remoteError : null,
    localFeedCount,
    refreshCloudFeeds: loadRemote,
    authLoading: !isLoaded,
  };
}
