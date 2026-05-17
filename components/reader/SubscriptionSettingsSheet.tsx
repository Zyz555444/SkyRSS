"use client";

import { X } from "lucide-react";
import { AppButton, AppInput, Surface } from "@/components/ui/glass";
import type { StoredFeed, StoredFolder } from "@/lib/reader-library-storage";
import { cn } from "@/lib/cn";

type SubscriptionSettingsSheetProps = {
  open: boolean;
  onClose: () => void;
  feeds: StoredFeed[];
  folders: StoredFolder[];
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
  onFeedFolderChange: (feedId: string, folderId: string | null) => void;
  onRemoveFeed: (id: string) => void;
  unreadByFeedId: Record<string, number>;
};

export function SubscriptionSettingsSheet({
  open,
  onClose,
  feeds,
  folders,
  newFolderName,
  setNewFolderName,
  onCreateFolder,
  onDeleteFolder,
  onFeedFolderChange,
  onRemoveFeed,
  unreadByFeedId,
}: SubscriptionSettingsSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[color:var(--drawer-backdrop)]"
        aria-label="关闭设置"
        onClick={onClose}
      />
      <Surface className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-t-2xl p-0 shadow-2xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-3">
          <p className="text-base font-semibold text-[color:var(--text)]">订阅源设置</p>
          <AppButton type="button" variant="icon" title="关闭" onClick={onClose}>
            <X className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-2 text-xs font-medium text-[color:var(--muted)]">管理分类</p>
          <div className="flex gap-2">
            <AppInput
              className="min-w-0 flex-1"
              placeholder="新分类名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreateFolder();
              }}
            />
            <AppButton type="button" onClick={onCreateFolder}>
              添加
            </AppButton>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {folders.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[color:var(--hover-row)]"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                <AppButton
                  type="button"
                  variant="ghost"
                  className="h-8 shrink-0 px-2 text-xs text-rose-600"
                  onClick={() => onDeleteFolder(f.id)}
                >
                  删除
                </AppButton>
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-4 text-xs font-medium text-[color:var(--muted)]">
            订阅源 ({feeds.length})
          </p>
          <ul className="flex flex-col gap-2">
            {feeds.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-[color:var(--border-subtle)] p-2"
              >
                <p className="truncate text-sm font-medium text-[color:var(--text)]">
                  {f.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`settings-folder-${f.id}`}>
                    分类
                  </label>
                  <select
                    id={`settings-folder-${f.id}`}
                    className={cn(
                      "ui-input min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs",
                    )}
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
                    className="h-8 shrink-0 px-2 text-xs text-rose-600"
                    onClick={() => onRemoveFeed(f.id)}
                  >
                    删除
                  </AppButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Surface>
    </div>
  );
}
