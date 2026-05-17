"use client";

import { Rss } from "lucide-react";
import { useState } from "react";
import { getFaviconSources } from "@/components/reader/sidebar/feed-favicon";
import { cn } from "@/lib/cn";

type FeedSourceRowProps = {
  title: string;
  url: string;
  unread: number;
  active?: boolean;
  onClick: () => void;
};

export function FeedSourceRow({
  title,
  url,
  unread,
  active,
  onClick,
}: FeedSourceRowProps) {
  const faviconSources = getFaviconSources(url);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const allSourcesFailed = currentSourceIndex >= faviconSources.length;
  const currentFavicon = allSourcesFailed ? "" : faviconSources[currentSourceIndex];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-[color:var(--accent-muted)] font-medium text-[color:var(--text)]"
          : "text-[color:var(--text)] hover:bg-[color:var(--hover-row)]",
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[color:var(--hover-row)]">
        {currentFavicon ? (
          <img
            src={currentFavicon}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
            onError={() => {
              const nextIndex = currentSourceIndex + 1;
              if (nextIndex < faviconSources.length) {
                setCurrentSourceIndex(nextIndex);
              }
            }}
            onLoad={() => {
              if (currentSourceIndex > 0) {
                setCurrentSourceIndex(0);
              }
            }}
          />
        ) : (
          <Rss className="h-3.5 w-3.5 text-[color:var(--muted)]" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="shrink-0 text-xs tabular-nums text-[color:var(--muted)]">
        {unread}
      </span>
    </button>
  );
}
