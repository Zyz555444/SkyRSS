"use client";

import { GlassButton } from "@/components/ui/glass";
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
        "glass-panel flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-xl",
        "min-h-[min(70dvh,560px)] lg:min-h-0",
        !isLargeScreen && (!item || !mobileShowReader) && "hidden",
      )}
    >
      {item ? (
        <>
          <div className="sticky top-0 z-10 shrink-0 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] px-4 py-3 backdrop-blur-md">
            {!isLargeScreen && mobileShowReader ? (
              <div className="mb-2">
                <GlassButton
                  type="button"
                  className="w-full text-sm sm:w-auto"
                  onClick={onBack}
                >
                  ← 返回列表
                </GlassButton>
              </div>
            ) : null}
            <p className="text-xs text-[color:var(--muted)]">阅读</p>
            <h3 className="mt-0.5 text-lg font-semibold leading-snug text-[color:var(--text)]">
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
            <div className="article-reading-shell px-4 py-4">
              <ArticleBody
                html={item.contentHtml}
                fallbackSnippet={item.contentSnippet}
              />
            </div>
          </div>

          {item.link ? (
            <div className="shrink-0 border-t border-[color:var(--glass-border)] px-4 py-3">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="reader-gradient-cta inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-center text-sm font-medium no-underline text-white transition-[filter,transform] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
              >
                在浏览器中打开原文
              </a>
            </div>
          ) : null}
        </>
      ) : (
        <div className="shrink-0 px-4 py-8">
          <p className="text-xs text-[color:var(--muted)]">阅读</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            在列表中选择一篇文章开始阅读。
          </p>
        </div>
      )}
    </section>
  );
}
