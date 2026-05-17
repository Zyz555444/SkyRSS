"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useRef,
} from "react";
import {
  ArticleListColumn,
  listRowCompositeKey,
  type ListRow,
} from "@/components/reader/ArticleListColumnOptimized";
import { ArticleReaderColumn } from "@/components/reader/ArticleReaderColumn";
import { ReaderAuthSlot, ReaderTopBar } from "@/components/reader/ReaderTopBar";
import { ReaderShell } from "@/components/reader/ReaderShell";
import { ReaderSidebarDesktop } from "@/components/reader/ReaderSidebarDesktop";
import { ReaderSidebarMobile } from "@/components/reader/ReaderSidebarMobile";
import { SubscriptionSettingsSheet } from "@/components/reader/SubscriptionSettingsSheet";
import type { ReaderNav } from "@/components/reader/types";
import { cn } from "@/lib/cn";
import {
  GlassButton,
  GlassInput,
  GlassPanel,
} from "@/components/ui/glass";
import { useFeeds } from "@/hooks/useFeeds";
import { useReaderLibrary, type ReaderItemPatchInput } from "@/hooks/useReaderLibrary";
import { fetchRssItemViewForSubscription } from "@/lib/fetch-rss-item-view";
import { mergeFeedItems, type SubscriptionRef } from "@/lib/merge-feed-items";
import { normalizeFeedUrlInput } from "@/lib/normalize-feed-url";
import type { StoredFeed, StoredReaderItem } from "@/lib/reader-library-storage";
import type { RssFeedJson, RssItemView } from "@/types/rss";
import { useDebounce } from "@/hooks/usePerformance";

const THEME_KEY = "skyrss-theme";
const THEME_EVENT = "skyrss-theme-change";

function subscribeStoredTheme(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(THEME_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(THEME_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getStoredThemeDark() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
}

function setStoredThemeDark(next: boolean) {
  try {
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(THEME_EVENT));
  }
}

function subscriptionsForNav(
  nav: ReaderNav,
  feeds: StoredFeed[],
): SubscriptionRef[] {
  if (nav.kind === "all") {
    return feeds.map((f) => ({ id: f.id, url: f.url, title: f.title }));
  }
  if (nav.kind === "source") {
    const f = feeds.find((x) => x.id === nav.sourceId);
    return f ? [{ id: f.id, url: f.url, title: f.title }] : [];
  }
  if (nav.kind === "folder") {
    return feeds
      .filter((f) => f.folderId === nav.folderId)
      .map((f) => ({ id: f.id, url: f.url, title: f.title }));
  }
  return [];
}

function listColumnTitle(
  nav: ReaderNav,
  folders: { id: string; name: string }[],
  feeds: StoredFeed[],
): string {
  switch (nav.kind) {
    case "all":
      return "全部文章";
    case "read_later":
      return "稍后阅读";
    case "favorites":
      return "收藏";
    case "recent":
      return "最近阅读";
    case "folder":
      return folders.find((f) => f.id === nav.folderId)?.name ?? "分类";
    case "source":
      return feeds.find((f) => f.id === nav.sourceId)?.title ?? "订阅";
  }
}

function snapshotToView(
  row: StoredReaderItem,
  feedTitleFallback: string,
): RssItemView {
  return {
    title: row.title,
    link: row.link ?? undefined,
    contentSnippet: row.snippet ?? undefined,
    subscriptionId: row.subscriptionId,
    feedTitle: row.feedTitle || feedTitleFallback,
    itemKey: row.itemKey,
  };
}

function itemToPatch(
  item: RssItemView,
  extra: Partial<
    Pick<ReaderItemPatchInput, "read" | "favorite" | "readLater" | "markOpened">
  >,
): ReaderItemPatchInput {
  return {
    subscriptionId: item.subscriptionId,
    itemKey: item.itemKey,
    title: item.title,
    link: item.link ?? null,
    snippet: item.contentSnippet ?? null,
    feedTitle: item.feedTitle,
    ...extra,
  };
}

function snapshotToPatch(
  row: StoredReaderItem,
  extra: Partial<
    Pick<ReaderItemPatchInput, "read" | "favorite" | "readLater" | "markOpened">
  >,
): ReaderItemPatchInput {
  return {
    subscriptionId: row.subscriptionId,
    itemKey: row.itemKey,
    title: row.title,
    link: row.link ?? null,
    snippet: row.snippet ?? null,
    feedTitle: row.feedTitle,
    ...extra,
  };
}

function rowToOpenPatch(row: ListRow): ReaderItemPatchInput {
  if (row.kind === "rss") {
    return itemToPatch(row.item, { read: true, markOpened: true });
  }
  return snapshotToPatch(row.row, { read: true, markOpened: true });
}

async function fetchFeedJsonForAdd(url: string): Promise<RssFeedJson> {
  const normalized = normalizeFeedUrlInput(url);
  const api = `/api/rss?url=${encodeURIComponent(normalized)}`;
  const res = await fetch(api);
  const data: unknown = await res.json();
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error || "加载失败");
  }
  return data as RssFeedJson;
}

export function ReaderApp() {
  const {
    feeds,
    addFeed,
    removeFeed,
    importLocalFeedsToCloud,
    feedSource,
    cloudLoading,
    cloudError,
    localFeedCount,
    authLoading,
    updateFeedFolder,
  } = useFeeds();

  const {
    folders,
    readerItems,
    getReaderRow,
    addFolder,
    deleteFolder,
    patchReaderItems,
    remoteLoading: readerRemoteLoading,
    remoteError: readerRemoteError,
  } = useReaderLibrary();

  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();

  const [nav, setNav] = useState<ReaderNav>({ kind: "all" });
  const [mergedItems, setMergedItems] = useState<RssItemView[]>([]);
  const [mergeErrors, setMergeErrors] = useState<
    { subscriptionId: string; title: string; message: string }[]
  >([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [activeItem, setActiveItem] = useState<RssItemView | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileShowReader, setMobileShowReader] = useState(false);
  const [isLg, setIsLg] = useState(false);

  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [importingLocal, setImportingLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const isDark = useSyncExternalStore(
    subscribeStoredTheme,
    getStoredThemeDark,
    () => false,
  );

  const [storedAllUnread, setStoredAllUnread] = useState(0);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsLg(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const subs = useMemo(
    () => subscriptionsForNav(nav, feeds),
    [nav, feeds],
  );
  const subsKey = useMemo(() => subs.map((s) => s.id).join(","), [subs]);

  const subsRef = useRef(subs);
  const navRef = useRef(nav);
  const getReaderRowRef = useRef(getReaderRow);

  useEffect(() => {
    subsRef.current = subs;
    navRef.current = nav;
    getReaderRowRef.current = getReaderRow;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const currentSubs = subsRef.current;
      const kind = navRef.current.kind;
      if (
        kind === "read_later" ||
        kind === "favorites" ||
        kind === "recent"
      ) {
        setMergedItems([]);
        setMergeErrors([]);
        setMergeLoading(false);
        return;
      }
      if (currentSubs.length === 0) {
        setMergedItems([]);
        setMergeErrors([]);
        setMergeLoading(false);
        return;
      }
      setMergeLoading(true);
      setMergeErrors([]);
      void mergeFeedItems(currentSubs).then((res) => {
        if (cancelled) return;
        setMergedItems(res.items);
        setMergeErrors(res.errors);
        setMergeLoading(false);
        setLastUpdatedMs(Date.now());
        if (navRef.current.kind === "all") {
          const unread = res.items.filter(
            (it) =>
              !getReaderRowRef.current(it.subscriptionId, it.itemKey)?.readAt,
          ).length;
          setStoredAllUnread(unread);
        }
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subsKey 已编码订阅集合，避免阅读状态变化触发重复合并
  }, [nav.kind, subsKey]);

  const sortedRows = useMemo(() => {
    if (nav.kind === "read_later") {
      return readerItems
        .filter((r) => r.readLater)
        .map((row) => ({ kind: "snapshot" as const, row }));
    }
    if (nav.kind === "favorites") {
      return readerItems
        .filter((r) => r.favorite)
        .map((row) => ({ kind: "snapshot" as const, row }));
    }
    if (nav.kind === "recent") {
      return [...readerItems]
        .filter((r) => r.lastOpenedAt)
        .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
        .slice(0, 200)
        .map((row) => ({ kind: "snapshot" as const, row }));
    }
    return [];
  }, [nav.kind, readerItems]);

  const rssRows = useMemo(
    () => mergedItems.map((item) => ({ kind: "rss" as const, item })),
    [mergedItems],
  );

  const baseRows =
    nav.kind === "read_later" ||
    nav.kind === "favorites" ||
    nav.kind === "recent"
      ? sortedRows
      : rssRows;

  const filteredRows = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q || baseRows.length === 0) return baseRows;
    return baseRows.filter((row) => {
      const title =
        row.kind === "rss" ? row.item.title : row.row.title;
      const src =
        row.kind === "rss" ? row.item.feedTitle : row.row.feedTitle;
      const sn =
        row.kind === "rss"
          ? (row.item.contentSnippet ?? "")
          : (row.row.snippet ?? "");
      const hay = `${title}\n${src}\n${sn}`.toLowerCase();
      return hay.includes(q);
    });
  }, [baseRows, debouncedSearchQuery]);

  const unreadWhenOnAll = useMemo(() => {
    if (nav.kind !== "all") return null;
    if (mergedItems.length === 0) return 0;
    let n = 0;
    for (const it of mergedItems) {
      const row = getReaderRow(it.subscriptionId, it.itemKey);
      if (!row?.readAt) n++;
    }
    return n;
  }, [nav.kind, mergedItems, getReaderRow]);

  const unreadTotal =
    unreadWhenOnAll !== null ? unreadWhenOnAll : storedAllUnread;

  const unreadByFeedId = useMemo(() => {
    const map: Record<string, number> = {};
    if (mergedItems.length === 0) return map;
    for (const it of mergedItems) {
      const row = getReaderRow(it.subscriptionId, it.itemKey);
      if (!row?.readAt) {
        map[it.subscriptionId] = (map[it.subscriptionId] ?? 0) + 1;
      }
    }
    return map;
  }, [mergedItems, getReaderRow]);

  const unreadByFolderId = useMemo(() => {
    const map: Record<string, number> = {};
    if (mergedItems.length === 0) return map;
    for (const it of mergedItems) {
      const feed = feeds.find((f) => f.id === it.subscriptionId);
      if (!feed?.folderId) continue;
      const row = getReaderRow(it.subscriptionId, it.itemKey);
      if (!row?.readAt) {
        map[feed.folderId] = (map[feed.folderId] ?? 0) + 1;
      }
    }
    return map;
  }, [mergedItems, feeds, getReaderRow]);

  const readLaterCount = useMemo(
    () => readerItems.filter((r) => r.readLater).length,
    [readerItems],
  );
  const favoritesCount = useMemo(
    () => readerItems.filter((r) => r.favorite).length,
    [readerItems],
  );
  const recentCount = useMemo(
    () => readerItems.filter((r) => r.lastOpenedAt).length,
    [readerItems],
  );

  const isUnread = useCallback(
    (row: ListRow) => {
      const sid =
        row.kind === "rss" ? row.item.subscriptionId : row.row.subscriptionId;
      const key = row.kind === "rss" ? row.item.itemKey : row.row.itemKey;
      return !getReaderRow(sid, key)?.readAt;
    },
    [getReaderRow],
  );

  const isFavorite = useCallback(
    (row: ListRow) => {
      const sid =
        row.kind === "rss" ? row.item.subscriptionId : row.row.subscriptionId;
      const key = row.kind === "rss" ? row.item.itemKey : row.row.itemKey;
      return Boolean(getReaderRow(sid, key)?.favorite);
    },
    [getReaderRow],
  );

  const handleSelectRow = useCallback(
    async (row: ListRow) => {
      setActiveKey(listRowCompositeKey(row));
      setError(null);
      try {
        if (row.kind === "rss") {
          setActiveItem(row.item);
          setMobileShowReader(true);
          await patchReaderItems([rowToOpenPatch(row)]);
          return;
        }
        const sub = feeds.find((f) => f.id === row.row.subscriptionId);
        if (sub) {
          const full = await fetchRssItemViewForSubscription(sub, row.row.itemKey);
          if (full) {
            setActiveItem(full);
          } else {
            setActiveItem(snapshotToView(row.row, sub.title));
          }
        } else {
          setActiveItem(snapshotToView(row.row, row.row.feedTitle));
        }
        setMobileShowReader(true);
        await patchReaderItems([rowToOpenPatch(row)]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "打开失败");
      }
    },
    [feeds, patchReaderItems],
  );

  const handleToggleFavorite = useCallback(
    async (row: ListRow) => {
      const sid =
        row.kind === "rss" ? row.item.subscriptionId : row.row.subscriptionId;
      const key = row.kind === "rss" ? row.item.itemKey : row.row.itemKey;
      const next = !getReaderRow(sid, key)?.favorite;
      const patch =
        row.kind === "rss"
          ? itemToPatch(row.item, { favorite: next })
          : snapshotToPatch(row.row, { favorite: next });
      try {
        await patchReaderItems([patch]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新失败");
      }
    },
    [getReaderRow, patchReaderItems],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (filteredRows.length === 0) return;
    const patches = filteredRows.map((row) =>
      row.kind === "rss"
        ? itemToPatch(row.item, { read: true })
        : snapshotToPatch(row.row, { read: true }),
    );
    try {
      await patchReaderItems(patches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    }
  }, [filteredRows, patchReaderItems]);

  const handleRefresh = useCallback(() => {
    void (async () => {
      if (
        nav.kind === "read_later" ||
        nav.kind === "favorites" ||
        nav.kind === "recent"
      ) {
        return;
      }
      if (subs.length === 0) return;
      setMergeLoading(true);
      try {
        const res = await mergeFeedItems(subs);
        setMergedItems(res.items);
        setMergeErrors(res.errors);
        setLastUpdatedMs(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "刷新失败");
      } finally {
        setMergeLoading(false);
      }
    })();
  }, [nav.kind, subs]);

  const handleAddFeed = useCallback(async () => {
    const normalized = normalizeFeedUrlInput(newUrl);
    if (!normalized) return;
    setAdding(true);
    setError(null);
    try {
      const json = await fetchFeedJsonForAdd(normalized);
      const entry = await addFeed({ url: normalized, title: json.title });
      setNewUrl("");
      setShowAddFeed(false);
      setNav({ kind: "source", sourceId: entry.id });
      setSidebarOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法添加该源");
    } finally {
      setAdding(false);
    }
  }, [addFeed, newUrl]);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setError(null);
    try {
      await addFolder(name);
      setNewFolderName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    }
  }, [addFolder, newFolderName]);

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      if (!window.confirm("删除此分类？订阅将变为未分类。")) return;
      setError(null);
      try {
        await deleteFolder(id);
        setNav((n) =>
          n.kind === "folder" && n.folderId === id ? { kind: "all" } : n,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      }
    },
    [deleteFolder],
  );

  const handleImportLocal = useCallback(async () => {
    setImportingLocal(true);
    setError(null);
    try {
      await importLocalFeedsToCloud();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setImportingLocal(false);
    }
  }, [importLocalFeedsToCloud]);

  const updatedLabel = lastUpdatedMs
    ? `更新于 ${new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastUpdatedMs))}`
    : "";

  const handleNav = useCallback((n: ReaderNav) => {
    setNav(n);
    setSidebarOpen(false);
    setActiveItem(null);
    setActiveKey(null);
    setMobileShowReader(false);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
      <ReaderShell>
        <ReaderTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          onMarkAllRead={() => void handleMarkAllRead()}
          onToggleTheme={() => setStoredThemeDark(!isDark)}
          isDark={isDark}
          refreshDisabled={mergeLoading}
          showDesktop={isLg}
          authSlot={
            <ReaderAuthSlot
              clerkLoaded={clerkLoaded}
              isSignedIn={Boolean(isSignedIn)}
              authLoading={authLoading}
            />
          }
        />

      {error ? (
        <div className="shrink-0 border-b border-rose-400/30 bg-rose-500/10 px-4 py-2 text-center text-sm text-rose-800 dark:text-rose-100">
          {error}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            关闭
          </button>
        </div>
      ) : null}

        <div
          className={cn(
            "grid min-h-0 flex-1 gap-3 p-3 lg:gap-4 lg:p-4",
            isLg
              ? "grid-cols-[minmax(220px,260px)_minmax(300px,38%)_1fr]"
              : "grid-cols-1",
          )}
        >
          {isLg ? (
            <ReaderSidebarDesktop
              nav={nav}
              onNav={handleNav}
              folders={folders}
              feeds={feeds}
              unreadTotal={unreadTotal}
              unreadByFolderId={unreadByFolderId}
              unreadByFeedId={unreadByFeedId}
              readLaterCount={readLaterCount}
              favoritesCount={favoritesCount}
              recentCount={recentCount}
              onOpenAddFeed={() => setShowAddFeed(true)}
              onOpenSettings={() => setShowSettings(true)}
              cloudLoading={cloudLoading || readerRemoteLoading}
              cloudError={cloudError ?? readerRemoteError}
            />
          ) : null}

          <ArticleListColumn
            title={listColumnTitle(nav, folders, feeds)}
            nav={nav}
            folders={folders}
            feeds={feeds}
            onNav={handleNav}
            rows={filteredRows}
            activeKey={activeKey}
            onSelectRow={(row) => void handleSelectRow(row)}
            isUnread={isUnread}
            onToggleFavorite={(row) => void handleToggleFavorite(row)}
            isFavorite={isFavorite}
            mergeErrors={mergeErrors.map((e) => ({
              title: e.title,
              message: e.message,
            }))}
            loading={mergeLoading}
            onMarkAllRead={() => void handleMarkAllRead()}
            isLargeScreen={isLg}
            mobileShowReader={mobileShowReader}
            onOpenMobileMenu={() => setSidebarOpen(true)}
            onRefresh={handleRefresh}
            updatedLabel={updatedLabel}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <ArticleReaderColumn
            item={activeItem}
            isLargeScreen={isLg}
            mobileShowReader={mobileShowReader}
            onBack={() => setMobileShowReader(false)}
          />
        </div>
      </ReaderShell>

      <ReaderSidebarMobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        nav={nav}
        onNav={handleNav}
        feeds={feeds}
        unreadTotal={unreadTotal}
        unreadByFeedId={unreadByFeedId}
        readLaterCount={readLaterCount}
        favoritesCount={favoritesCount}
        recentCount={recentCount}
        onOpenAddFeed={() => {
          setShowAddFeed(true);
          setSidebarOpen(false);
        }}
        onOpenSettings={() => {
          setShowSettings(true);
          setSidebarOpen(false);
        }}
        isDark={isDark}
        onToggleTheme={() => setStoredThemeDark(!isDark)}
        cloudLoading={cloudLoading || readerRemoteLoading}
        cloudError={cloudError ?? readerRemoteError}
      />

      <SubscriptionSettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        feeds={feeds}
        folders={folders}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onCreateFolder={() => void handleCreateFolder()}
        onDeleteFolder={(id) => void handleDeleteFolder(id)}
        onFeedFolderChange={(feedId, folderId) => {
          void (async () => {
            try {
              await updateFeedFolder(feedId, folderId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "更新失败");
            }
          })();
        }}
        onRemoveFeed={(id) => {
          void (async () => {
            try {
              await removeFeed(id);
              setNav((n) =>
                n.kind === "source" && n.sourceId === id
                  ? { kind: "all" }
                  : n,
              );
              if (activeItem?.subscriptionId === id) {
                setActiveItem(null);
                setActiveKey(null);
                setMobileShowReader(false);
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "删除失败");
            }
          })();
        }}
        unreadByFeedId={unreadByFeedId}
      />

      {showAddFeed ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <GlassPanel className="w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[color:var(--text)]">
                添加订阅
              </p>
              <GlassButton type="button" onClick={() => setShowAddFeed(false)}>
                关闭
              </GlassButton>
            </div>
            <GlassInput
              className="mt-3"
              type="url"
              inputMode="url"
              placeholder="https://example.com/feed.xml"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddFeed();
              }}
            />
            <GlassButton
              type="button"
              className="mt-3 w-full"
              disabled={adding || !newUrl.trim()}
              onClick={() => void handleAddFeed()}
            >
              {adding ? "验证并添加…" : "添加订阅"}
            </GlassButton>
            {clerkLoaded && isSignedIn && localFeedCount > 0 ? (
              <GlassButton
                type="button"
                className="mt-2 w-full"
                disabled={importingLocal}
                onClick={() => void handleImportLocal()}
              >
                {importingLocal
                  ? "正在导入本地订阅…"
                  : "将本地订阅导入云端"}
              </GlassButton>
            ) : null}
            {feedSource === "cloud" ? (
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                登录后订阅与阅读状态保存在云端。
              </p>
            ) : (
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                未登录时数据仅保存在本浏览器。
              </p>
            )}
          </GlassPanel>
        </div>
      ) : null}
    </div>
  );
}
