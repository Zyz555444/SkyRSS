"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getLibrarySnapshot,
  newLocalId,
  subscribeLibrary,
  updateLibrary,
  upsertLocalReaderItems,
  type StoredFolder,
  type StoredReaderItem,
} from "@/lib/reader-library-storage";

type RemoteFolderJson = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: number;
};

type RemoteReaderItemJson = {
  id: string;
  subscriptionId: string;
  itemKey: string;
  title: string;
  link: string | null;
  snippet: string | null;
  feedTitle: string;
  readAt: number | null;
  favorite: boolean;
  readLater: boolean;
  lastOpenedAt: number | null;
  updatedAt: number;
};

function mapRemoteFolder(row: RemoteFolderJson): StoredFolder {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
  };
}

function mapRemoteReaderItem(row: RemoteReaderItemJson): StoredReaderItem {
  return {
    subscriptionId: row.subscriptionId,
    itemKey: row.itemKey,
    title: row.title,
    link: row.link ?? null,
    snippet: row.snippet ?? null,
    feedTitle: row.feedTitle,
    readAt: row.readAt,
    favorite: row.favorite,
    readLater: row.readLater,
    lastOpenedAt: row.lastOpenedAt,
    updatedAt: row.updatedAt,
  };
}

export type ReaderItemPatchInput = {
  subscriptionId: string;
  itemKey: string;
  title: string;
  link?: string | null;
  snippet?: string | null;
  feedTitle: string;
  read?: boolean;
  favorite?: boolean;
  readLater?: boolean;
  markOpened?: boolean;
};

export function useReaderLibrary() {
  const { isSignedIn, isLoaded } = useAuth();

  const localFolders = useSyncExternalStore(
    subscribeLibrary,
    () => getLibrarySnapshot().folders,
    () => [],
  );

  const localReaderItems = useSyncExternalStore(
    subscribeLibrary,
    () => getLibrarySnapshot().readerItems,
    () => [],
  );

  const [remoteFolders, setRemoteFolders] = useState<StoredFolder[]>([]);
  const [remoteReaderItems, setRemoteReaderItems] = useState<
    StoredReaderItem[]
  >([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const loadRemoteFolders = useCallback(async () => {
    const res = await fetch("/api/folders", { cache: "no-store" });
    if (res.status === 401) {
      setRemoteFolders([]);
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `加载文件夹失败 (${res.status})`);
    }
    const rows = (await res.json()) as RemoteFolderJson[];
    setRemoteFolders(rows.map(mapRemoteFolder));
  }, []);

  const loadRemoteReaderItems = useCallback(async () => {
    const res = await fetch("/api/reader/items", { cache: "no-store" });
    if (res.status === 401) {
      setRemoteReaderItems([]);
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `加载阅读状态失败 (${res.status})`);
    }
    const rows = (await res.json()) as RemoteReaderItemJson[];
    setRemoteReaderItems(rows.map(mapRemoteReaderItem));
  }, []);

  const refreshRemote = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      await Promise.all([loadRemoteFolders(), loadRemoteReaderItems()]);
    } catch (e) {
      setRemoteError(e instanceof Error ? e.message : "加载失败");
      setRemoteFolders([]);
      setRemoteReaderItems([]);
    } finally {
      setRemoteLoading(false);
    }
  }, [isLoaded, isSignedIn, loadRemoteFolders, loadRemoteReaderItems]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const t = window.setTimeout(() => {
      void refreshRemote();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isLoaded, isSignedIn, refreshRemote]);

  const folders = useMemo(
    () =>
      isLoaded && isSignedIn
        ? [...remoteFolders].sort((a, b) => a.sortOrder - b.sortOrder)
        : [...localFolders].sort((a, b) => a.sortOrder - b.sortOrder),
    [isLoaded, isSignedIn, remoteFolders, localFolders],
  );

  const readerItems = useMemo(
    () => (isLoaded && isSignedIn ? remoteReaderItems : localReaderItems),
    [isLoaded, isSignedIn, remoteReaderItems, localReaderItems],
  );

  const getReaderRow = useCallback(
    (subscriptionId: string, itemKey: string): StoredReaderItem | undefined =>
      readerItems.find(
        (r) => r.subscriptionId === subscriptionId && r.itemKey === itemKey,
      ),
    [readerItems],
  );

  const addFolder = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!isLoaded) return;
      if (isSignedIn) {
        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          id?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "创建失败");
        await loadRemoteFolders();
        return;
      }
      updateLibrary((lib) => ({
        ...lib,
        folders: [
          ...lib.folders,
          {
            id: newLocalId(),
            name: trimmed,
            sortOrder: lib.folders.length,
          },
        ],
      }));
    },
    [isLoaded, isSignedIn, loadRemoteFolders],
  );

  const updateFolder = useCallback(
    async (id: string, patch: { name?: string; sortOrder?: number }) => {
      if (!isLoaded) return;
      if (isSignedIn) {
        const res = await fetch(`/api/folders/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "更新失败");
        await loadRemoteFolders();
        return;
      }
      updateLibrary((lib) => ({
        ...lib,
        folders: lib.folders.map((f) => {
          if (f.id !== id) return f;
          return {
            ...f,
            ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
            ...(patch.sortOrder !== undefined
              ? { sortOrder: patch.sortOrder }
              : {}),
          };
        }),
      }));
    },
    [isLoaded, isSignedIn, loadRemoteFolders],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!isLoaded) return;
      if (isSignedIn) {
        const res = await fetch(`/api/folders/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 404) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "删除失败");
        }
        await loadRemoteFolders();
        return;
      }
      updateLibrary((lib) => ({
        ...lib,
        folders: lib.folders.filter((f) => f.id !== id),
        feeds: lib.feeds.map((f) =>
          f.folderId === id ? { ...f, folderId: null } : f,
        ),
      }));
    },
    [isLoaded, isSignedIn, loadRemoteFolders],
  );

  const mergePatchIntoRow = useCallback(
    (
      existing: StoredReaderItem | undefined,
      patch: ReaderItemPatchInput,
    ): StoredReaderItem => {
      const now = Date.now();
      const readAt =
        patch.read === true
          ? now
          : patch.read === false
            ? null
            : (existing?.readAt ?? null);
      const favorite =
        patch.favorite !== undefined ? patch.favorite : (existing?.favorite ?? false);
      const readLater =
        patch.readLater !== undefined
          ? patch.readLater
          : (existing?.readLater ?? false);
      const lastOpenedAt = patch.markOpened
        ? now
        : (existing?.lastOpenedAt ?? null);
      return {
        subscriptionId: patch.subscriptionId,
        itemKey: patch.itemKey,
        title: patch.title,
        link: patch.link ?? existing?.link ?? null,
        snippet: patch.snippet ?? existing?.snippet ?? null,
        feedTitle: patch.feedTitle,
        readAt: readAt ?? null,
        favorite,
        readLater,
        lastOpenedAt: lastOpenedAt ?? null,
        updatedAt: now,
      };
    },
    [],
  );

  const patchReaderItems = useCallback(
    async (patches: ReaderItemPatchInput[]) => {
      if (!isLoaded || patches.length === 0) return;
      if (isSignedIn) {
        const res = await fetch("/api/reader/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: patches }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "更新失败");
        await loadRemoteReaderItems();
        return;
      }
      const rows = patches.map((p) =>
        mergePatchIntoRow(
          localReaderItems.find(
            (r) => r.subscriptionId === p.subscriptionId && r.itemKey === p.itemKey,
          ),
          p,
        ),
      );
      upsertLocalReaderItems(rows);
    },
    [
      isLoaded,
      isSignedIn,
      localReaderItems,
      loadRemoteReaderItems,
      mergePatchIntoRow,
    ],
  );

  return {
    folders,
    readerItems,
    getReaderRow,
    addFolder,
    updateFolder,
    deleteFolder,
    patchReaderItems,
    refreshRemote,
    remoteLoading: Boolean(isLoaded && isSignedIn && remoteLoading),
    remoteError: isLoaded && isSignedIn ? remoteError : null,
    source: isLoaded && isSignedIn ? ("cloud" as const) : ("local" as const),
  };
}
