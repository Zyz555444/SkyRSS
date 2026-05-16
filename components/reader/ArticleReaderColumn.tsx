"use client";

import { AppButton } from "@/components/ui/glass";
import { cn } from "@/lib/cn";
import { ArticleBody } from "@/components/reader/ArticleBody";
import type { RssItemView } from "@/types/rss";

function formatArticleDate(item: RssItemView): string | null {
  const raw = item.isoDate || item.pubDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
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
  const activeDateLabel = item ? formatArticleDate(item) : null;

  return (
    <section
      className={cn(
        "ui-surface flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-xl border",
        "min-h-[min(70dvh,560px)] lg:min-h-0",
        !isLargeScreen && (!item || !mobileShowReader) && "hidden",
      )}
    >
      {item ? (
        <>
          <div className="sticky top-0 z-10 shrink-0 border-b border-[color:var(--border-subtle)] bg-[color:var(--surface)] px-4 py-3">
            {!isLargeScreen && mobileShowReader ? (
              <div className="mb-2">
                <AppButton
                  type="button"
                  variant="ghost"
                  className="w-full text-sm sm:w-auto"
                  onClick={onBack}
                >
                  ← 返回列表
                </AppButton>
              </div>
            ) : null}
            <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
              阅读
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug text-[color:var(--text)]">
              {item.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--muted)]">
              <span>{item.feedTitle}</span>
              {activeDateLabel ? (
                <>
                  <span className="opacity-40" aria-hidden>
                    ·
                  </span>
                  <span>{activeDateLabel}</span>
                </>
              ) : null}
              {item.author ? (
                <>
                  <span className="opacity-40" aria-hidden>
                    ·
                  </span>
                  <span>{item.author}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="article-reading-shell px-4 py-5">
              <ArticleBody
                html={item.contentHtml}
                fallbackSnippet={item.contentSnippet}
              />
            </div>
          </div>

          {item.link ? (
            <div className="shrink-0 border-t border-[color:var(--border-subtle)] px-4 py-3">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="reader-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-center text-sm font-medium no-underline transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
              >
                在浏览器中打开原文
              </a>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-medium text-[color:var(--text)]">
            选择一篇文章开始阅读
          </p>
          <p className="mt-2 max-w-xs text-sm text-[color:var(--muted)]">
            从左侧列表中选择条目，正文将显示在此处。
          </p>
        </div>
      )}
    </section>
  );
}
