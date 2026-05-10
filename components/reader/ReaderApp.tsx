"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GlassButton,
  GlassInput,
  GlassLink,
  GlassPanel,
} from "@/components/ui/glass";
import { useFeeds } from "@/hooks/useFeeds";
import { cn } from "@/lib/cn";
import { normalizeFeedUrlInput } from "@/lib/normalize-feed-url";
import type { RssApiErrorJson, RssFeedJson, RssItemJson } from "@/types/rss";

async function fetchFeedJson(url: string): Promise<RssFeedJson> {
  const normalized = normalizeFeedUrlInput(url);
  const api = `/api/rss?url=${encodeURIComponent(normalized)}`;
  const res = await fetch(api);
  const data: unknown = await res.json();
  if (!res.ok) {
    const err = data as RssApiErrorJson;
    throw new Error(err.error || "加载失败");
  }
  return data as RssFeedJson;
}

export function ReaderApp() {
  const { feeds, addFeed, removeFeed, updateFeedTitle } = useFeeds();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selected = useMemo(
    () => feeds.find((f) => f.id === selectedId) ?? null,
    [feeds, selectedId],
  );

  const [feedData, setFeedData] = useState<RssFeedJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<RssItemJson | null>(null);

  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const refresh = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchFeedJson(url);
      setFeedData(json);
      setActiveItem(null);
    } catch (e) {
      setFeedData(null);
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectFeed = useCallback(
    async (id: string, url: string) => {
      setSelectedId(id);
      setSidebarOpen(false);
      await refresh(url);
    },
    [refresh],
  );

  useEffect(() => {
    if (selectedId !== null || feeds.length === 0) return;
    const first = feeds[0];
    queueMicrotask(() => {
      void handleSelectFeed(first.id, first.url);
    });
  }, [feeds, handleSelectFeed, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if (feeds.some((f) => f.id === selectedId)) return;
    queueMicrotask(() => {
      setSelectedId(null);
      setFeedData(null);
      setActiveItem(null);
    });
  }, [feeds, selectedId]);

  const handleAdd = useCallback(async () => {
    const normalized = normalizeFeedUrlInput(newUrl);
    if (!normalized) return;
    setAdding(true);
    setError(null);
    try {
      const json = await fetchFeedJson(normalized);
      const entry = addFeed({ url: normalized, title: json.title });
      setNewUrl("");
      setSelectedId(entry.id);
      setFeedData(json);
      setActiveItem(null);
      setSidebarOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法添加该源");
    } finally {
      setAdding(false);
    }
  }, [addFeed, newUrl]);

  const beginEdit = useCallback((id: string, title: string) => {
    setEditingId(id);
    setEditDraft(title);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    updateFeedTitle(editingId, editDraft);
    setEditingId(null);
  }, [editDraft, editingId, updateFeedTitle]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Glass RSS
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--text)]">
            在线 RSS 阅读
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton
            className="lg:hidden"
            type="button"
            aria-expanded={sidebarOpen}
            aria-controls="feed-sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? "收起订阅" : "订阅栏"}
          </GlassButton>
          {selected && (
            <GlassButton
              type="button"
              onClick={() => void refresh(selected.url)}
              disabled={loading}
            >
              刷新当前源
            </GlassButton>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <aside
            id="feed-sidebar"
            className={cn(
              "flex w-full shrink-0 flex-col gap-3 lg:w-72",
              sidebarOpen ? "flex" : "hidden lg:flex",
            )}
          >
            <GlassPanel className="flex flex-col gap-3">
              <p className="text-sm font-medium text-[color:var(--text)]">
                添加订阅
              </p>
              <GlassInput
                type="url"
                inputMode="url"
                placeholder="https://example.com/feed.xml"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAdd();
                }}
                aria-label="RSS 订阅地址"
              />
              <GlassButton
                type="button"
                onClick={() => void handleAdd()}
                disabled={adding || !newUrl.trim()}
              >
                {adding ? "验证并添加…" : "添加订阅"}
              </GlassButton>
            </GlassPanel>

            <GlassPanel className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-0">
              <div className="border-b border-[color:var(--glass-border)] px-4 py-3 text-sm font-medium text-[color:var(--text)]">
                我的订阅 ({feeds.length})
              </div>
              <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
                {feeds.length === 0 ? (
                  <li className="px-2 py-6 text-center text-sm text-[color:var(--muted)]">
                    暂无订阅，请在上方添加 RSS 地址。
                  </li>
                ) : (
                  feeds.map((f) => {
                    const active = f.id === selectedId;
                    return (
                      <li key={f.id}>
                        <div
                          className={cn(
                            "flex flex-col gap-2 rounded-xl px-2 py-2 transition-colors",
                            active
                              ? "bg-[color:var(--glass-active)]"
                              : "hover:bg-[color:var(--hover-row)]",
                          )}
                        >
                          {editingId === f.id ? (
                            <div className="flex flex-col gap-2">
                              <GlassInput
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                aria-label="编辑订阅标题"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit();
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <div className="flex gap-2">
                                <GlassButton
                                  type="button"
                                  className="flex-1"
                                  onClick={commitEdit}
                                >
                                  保存
                                </GlassButton>
                                <GlassButton
                                  type="button"
                                  className="flex-1"
                                  onClick={() => setEditingId(null)}
                                >
                                  取消
                                </GlassButton>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="w-full text-left text-sm font-medium text-[color:var(--text)]"
                                onClick={() => void handleSelectFeed(f.id, f.url)}
                              >
                                {f.title}
                              </button>
                              <p className="truncate text-xs text-[color:var(--muted)]">
                                {f.url}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <GlassButton
                                  type="button"
                                  className="flex-1 text-xs"
                                  onClick={() => beginEdit(f.id, f.title)}
                                >
                                  重命名
                                </GlassButton>
                                <GlassButton
                                  type="button"
                                  className="flex-1 text-xs"
                                  onClick={() => void handleSelectFeed(f.id, f.url)}
                                  disabled={loading && active}
                                >
                                  打开
                                </GlassButton>
                                <GlassButton
                                  type="button"
                                  className="text-xs text-rose-600"
                                  onClick={() => {
                                    removeFeed(f.id);
                                    if (selectedId === f.id) {
                                      setSelectedId(null);
                                      setFeedData(null);
                                    }
                                  }}
                                >
                                  删除
                                </GlassButton>
                              </div>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </GlassPanel>
          </aside>

          <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
            <GlassPanel className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-0">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[color:var(--glass-border)] px-4 py-3">
                <div>
                  <p className="text-xs text-[color:var(--muted)]">当前频道</p>
                  <h2 className="text-lg font-semibold text-[color:var(--text)]">
                    {feedData?.title ?? "未选择订阅"}
                  </h2>
                  {feedData?.link && (
                    <a
                      href={feedData.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs text-sky-700 underline-offset-2 hover:underline"
                    >
                      打开站点主页
                    </a>
                  )}
                </div>
                {loading && (
                  <span className="text-xs text-[color:var(--muted)]">
                    加载中…
                  </span>
                )}
              </div>

              {error && (
                <div className="mx-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {error}
                </div>
              )}

              <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
                {!loading &&
                  !error &&
                  feedData &&
                  feedData.items.map((item, idx) => {
                    const key = item.link || `${item.title}-${idx}`;
                    const isActive =
                      activeItem &&
                      (activeItem.link
                        ? activeItem.link === item.link
                        : activeItem.title === item.title);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => setActiveItem(item)}
                          className={cn(
                            "w-full rounded-xl px-3 py-3 text-left transition-colors",
                            isActive
                              ? "bg-[color:var(--glass-active)]"
                              : "hover:bg-[color:var(--hover-row)]",
                          )}
                        >
                          <p className="text-sm font-medium text-[color:var(--text)]">
                            {item.title}
                          </p>
                          {item.pubDate && (
                            <p className="mt-1 text-xs text-[color:var(--muted)]">
                              {item.pubDate}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                {!loading && !error && feedData && feedData.items.length === 0 && (
                  <li className="px-3 py-8 text-center text-sm text-[color:var(--muted)]">
                    此源暂无条目。
                  </li>
                )}
                {!feedData && !loading && !error && (
                  <li className="px-3 py-10 text-center text-sm text-[color:var(--muted)]">
                    请选择左侧订阅，或添加新的 RSS 地址。
                  </li>
                )}
              </ul>
            </GlassPanel>

            <GlassPanel className="flex min-h-[220px] w-full shrink-0 flex-col gap-3 xl:w-[22rem]">
              <p className="text-sm font-medium text-[color:var(--text)]">
                摘要
              </p>
              {activeItem ? (
                <>
                  <h3 className="text-base font-semibold leading-snug text-[color:var(--text)]">
                    {activeItem.title}
                  </h3>
                  {activeItem.pubDate && (
                    <p className="text-xs text-[color:var(--muted)]">
                      {activeItem.pubDate}
                    </p>
                  )}
                  <p className="max-h-64 overflow-y-auto text-sm leading-relaxed text-[color:var(--text)]">
                    {activeItem.contentSnippet?.trim() || "（无摘要，请查看原文）"}
                  </p>
                  {activeItem.link && (
                    <GlassLink
                      href={activeItem.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="w-full text-center"
                    >
                      在浏览器中打开原文
                    </GlassLink>
                  )}
                </>
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  点击中间列表中的文章以查看摘要与原文链接。
                </p>
              )}
            </GlassPanel>
          </div>
      </div>
    </div>
  );
}
