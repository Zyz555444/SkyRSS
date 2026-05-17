"use client";

import { ExternalLink } from "lucide-react";
import { AppButton } from "@/components/ui/glass";
import { cn } from "@/lib/cn";
import { ArticleBody } from "@/components/reader/ArticleBody";
import { formatRelativeTimeZh } from "@/lib/format-relative-time";
import type { RssItemView } from "@/types/rss";

function metaLabel(item: RssItemView): string {
  const raw = item.isoDate || item.pubDate;
  const time = raw ? formatRelativeTimeZh(raw) : null;
  return time ? `${item.feedTitle} · ${time}` : item.feedTitle;
}

type ArticleReaderColumnProps = {
  item: RssItemView | null;
  isLargeScreen: boolean;
  mobileShowReader: boolean;
  onBack: () => void;
};

export function ArticleReaderColumn({
  item,
  isLargeScreen,
  mobileShowReader,
  onBack,
}: ArticleReaderColumnProps) {
  return (
    <section
      className={cn(
        "reader-column-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden shadow-none",
        "min-h-[min(70dvh,560px)] lg:min-h-0",
        !isLargeScreen && (!item || !mobileShowReader) && "hidden",
      )}
    >
      {item ? (
        <>
          <div className="shrink-0 px-6 pb-4 pt-6 lg:px-8 lg:pt-8">
            {!isLargeScreen && mobileShowReader ? (
              <AppButton
                type="button"
                variant="ghost"
                className="mb-3 -ml-2 text-sm"
                onClick={onBack}
              >
                ← 返回列表
              </AppButton>
            ) : null}
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[color:var(--text)] lg:text-[1.65rem]">
              {item.title}
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              {metaLabel(item)}
              {item.author ? (
                <>
                  <span className="mx-1 opacity-40" aria-hidden>
                    ·
                  </span>
                  {item.author}
                </>
              ) : null}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 lg:px-8">
            <div className="article-reading-shell max-w-none py-2 pb-6">
              <ArticleBody
                html={item.contentHtml}
                fallbackSnippet={item.contentSnippet}
              />
            </div>
          </div>

          {item.link ? (
            <div className="shrink-0 px-6 py-5 lg:px-8">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="reader-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-center text-sm font-medium no-underline transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                在浏览器中打开原文
              </a>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <p className="text-base font-medium text-[color:var(--text)]">
            选择一篇文章开始阅读
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[color:var(--muted)]">
            从列表中选择条目，正文将显示在此处。
          </p>
        </div>
      )}
    </section>
  );
}
