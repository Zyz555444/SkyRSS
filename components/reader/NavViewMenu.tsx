"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AppButton } from "@/components/ui/glass";
import type { ReaderNav } from "@/components/reader/types";
import type { StoredFeed, StoredFolder } from "@/lib/reader-library-storage";
import { cn } from "@/lib/cn";

type NavViewMenuProps = {
  title: string;
  nav: ReaderNav;
  folders: StoredFolder[];
  feeds: StoredFeed[];
  onNav: (n: ReaderNav) => void;
  align?: "left" | "center";
};

export function NavViewMenu({
  title,
  nav,
  folders,
  feeds,
  onNav,
  align = "left",
}: NavViewMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (n: ReaderNav) => {
    onNav(n);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative min-w-0", align === "center" && "mx-auto")}>
      <AppButton
        type="button"
        variant="ghost"
        className={cn(
          "h-auto max-w-full gap-1 border-0 bg-transparent px-1 py-0.5 shadow-none",
          align === "center" && "mx-auto",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-base font-semibold text-[color:var(--text)]">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[color:var(--muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </AppButton>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-64 min-w-[12rem] overflow-y-auto rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] py-1 shadow-[var(--shadow-lg)]">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--hover-row)]"
            onClick={() => pick({ kind: "all" })}
          >
            全部文章
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--hover-row)]"
            onClick={() => pick({ kind: "read_later" })}
          >
            稍后阅读
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--hover-row)]"
            onClick={() => pick({ kind: "favorites" })}
          >
            收藏
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--hover-row)]"
            onClick={() => pick({ kind: "recent" })}
          >
            最近阅读
          </button>
          {folders.length > 0 ? (
            <p className="mt-1 border-t border-[color:var(--border-subtle)] px-3 pt-2 text-[10px] font-medium uppercase text-[color:var(--muted)]">
              分类
            </p>
          ) : null}
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--hover-row)]"
              onClick={() => pick({ kind: "folder", folderId: f.id })}
            >
              {f.name}
            </button>
          ))}
          {feeds.length > 0 ? (
            <p className="mt-1 border-t border-[color:var(--border-subtle)] px-3 pt-2 text-[10px] font-medium uppercase text-[color:var(--muted)]">
              订阅源
            </p>
          ) : null}
          {feeds.map((f) => (
            <button
              key={f.id}
              type="button"
              className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-[color:var(--hover-row)]"
              onClick={() => pick({ kind: "source", sourceId: f.id })}
            >
              {f.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
