"use client";

import { useEffect } from "react";
import type { StoredFeed, StoredFolder } from "@/lib/reader-library-storage";
import { AppButton, AppInput } from "@/components/ui/glass";
import { cn } from "@/lib/cn";
import type { ReaderNav } from "@/components/reader/types";

type ReaderSidebarProps = {
  open: boolean;
  onClose: () => void;
  nav: ReaderNav;
  onNav: (n: ReaderNav) => void;
  folders: StoredFolder[];
  feeds: StoredFeed[];
  unreadTotal: number;
  unreadByFeedId: Record<string, number>;
  readLaterCount: number;
  favoritesCount: number;
  recentCount: number;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
  onFeedFolderChange: (feedId: string, folderId: string | null) => void;
  onRemoveFeed: (id: string) => void;
  onOpenAddFeed: () => void;
  cloudLoading?: boolean;
  cloudError?: string | null;
};

function navButtonClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    active
      ? "bg-[color:var(--accent-muted)] font-medium text-[color:var(--text)]"
      : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
  );
}

export function ReaderSidebar({
  open,
  onClose,
  nav,
  onNav,
  folders,
  feeds,
  unreadTotal,
  unreadByFeedId,
  readLaterCount,
  favoritesCount,
  recentCount,
  newFolderName,
  setNewFolderName,
  onCreateFolder,
  onDeleteFolder,
  onFeedFolderChange,
  onRemoveFeed,
  onOpenAddFeed,
  cloudLoading,
  cloudError,
}: ReaderSidebarProps) {
  const allActive = nav.kind === "all";
  const rlActive = nav.kind === "read_later";
  const favActive = nav.kind === "favorites";
  const recActive = nav.kind === "recent";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[color:var(--drawer-backdrop)]"
          aria-label="关闭订阅抽屉"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="reader-sidebar"
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label="订阅与分类"
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex w-[min(20rem,88vw)] max-w-md flex-col overflow-hidden border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] shadow-[var(--shadow-lg)] transition-transform duration-200 ease-out sm:w-80",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--border-subtle)] px-4 py-3">
          <p className="text-base font-semibold text-[color:var(--text)]">订阅</p>
          <div className="flex items-center gap-1">
            <AppButton
              type="button"
              className="h-9 w-9 shrink-0 rounded-lg p-0 text-lg"
              title="添加订阅"
              onClick={onOpenAddFeed}
            >
              +
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              className="h-9 w-9 shrink-0 rounded-lg p-0"
              title="关闭"
              onClick={onClose}
            >
              ×
            </AppButton>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <section className="border-b border-[color:var(--border-subtle)] px-3 py-3">
            {cloudLoading ? (
              <p className="mb-2 text-xs text-[color:var(--muted)]">云端同步中…</p>
            ) : null}
            {cloudError ? (
              <p className="mb-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-700 dark:text-rose-200">
                {cloudError}
              </p>
            ) : null}

            <nav className="flex flex-col gap-0.5">
              <button
                type="button"
                className={navButtonClass(allActive)}
                onClick={() => onNav({ kind: "all" })}
              >
                <span className="min-w-0 flex-1 truncate">全部文章</span>
                <span className="shrink-0 rounded-md bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                  {unreadTotal}
                </span>
              </button>
              <button
                type="button"
                className={navButtonClass(rlActive)}
                onClick={() => onNav({ kind: "read_later" })}
              >
                <span className="min-w-0 flex-1 truncate">稍后阅读</span>
                <span className="shrink-0 rounded-md bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                  {readLaterCount}
                </span>
              </button>
              <button
                type="button"
                className={navButtonClass(favActive)}
                onClick={() => onNav({ kind: "favorites" })}
              >
                <span className="min-w-0 flex-1 truncate">收藏</span>
                <span className="shrink-0 rounded-md bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                  {favoritesCount}
                </span>
              </button>
              <button
                type="button"
                className={navButtonClass(recActive)}
                onClick={() => onNav({ kind: "recent" })}
              >
                <span className="min-w-0 flex-1 truncate">最近阅读</span>
                <span className="shrink-0 rounded-md bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                  {recentCount}
                </span>
              </button>
            </nav>
          </section>

          <section className="border-b border-[color:var(--border-subtle)] px-3 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
              分类
            </p>
            <div className="flex gap-2">
              <AppInput
                className="min-w-0 flex-1 text-sm"
                placeholder="新分类名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateFolder();
                }}
              />
              <AppButton type="button" className="shrink-0" onClick={onCreateFolder}>
                添加
              </AppButton>
            </div>
            <ul className="mt-2 flex max-h-36 flex-col gap-0.5 overflow-y-auto">
              {folders.map((f) => {
                const active = nav.kind === "folder" && nav.folderId === f.id;
                return (
                  <li
                    key={f.id}
                    className="flex items-center gap-1 rounded-lg hover:bg-[color:var(--hover-row)]"
                  >
                    <button
                      type="button"
                      className={cn(navButtonClass(active), "flex-1")}
                      onClick={() => onNav({ kind: "folder", folderId: f.id })}
                    >
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    </button>
                    <AppButton
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 rounded-lg p-0 text-xs text-rose-600"
                      title="删除分类"
                      onClick={() => onDeleteFolder(f.id)}
                    >
                      ×
                    </AppButton>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex min-h-0 flex-1 flex-col px-3 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
              订阅源 ({feeds.length})
            </p>
            <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
              {feeds.length === 0 ? (
                <li className="py-6 text-center text-sm text-[color:var(--muted)]">
                  暂无订阅，点击上方 + 添加
                </li>
              ) : (
                feeds.map((f) => {
                  const active = nav.kind === "source" && nav.sourceId === f.id;
                  const n = unreadByFeedId[f.id] ?? 0;
                  return (
                    <li key={f.id} className="rounded-lg py-0.5">
                      <button
                        type="button"
                        className={navButtonClass(active)}
                        onClick={() => onNav({ kind: "source", sourceId: f.id })}
                      >
                        <span className="min-w-0 flex-1 truncate text-left">
                          {f.title}
                        </span>
                        <span className="shrink-0 rounded-md bg-[color:var(--hover-row)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--muted)]">
                          {n}
                        </span>
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-2 px-1 pb-1">
                        <label className="sr-only" htmlFor={`folder-${f.id}`}>
                          分类
                        </label>
                        <select
                          id={`folder-${f.id}`}
                          className="ui-input min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs text-[color:var(--text)]"
                          value={f.folderId ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            onFeedFolderChange(f.id, v === "" ? null : v);
                          }}
                        >
                          <option value="">未分类</option>
                          {folders.map((fo) => (
                            <option key={fo.id} value={fo.id}>
                              {fo.name}
                            </option>
                          ))}
                        </select>
                        <AppButton
                          type="button"
                          variant="ghost"
                          className="h-8 shrink-0 rounded-lg px-2 text-xs text-rose-600"
                          title="删除订阅"
                          onClick={() => onRemoveFeed(f.id)}
                        >
                          删除
                        </AppButton>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
