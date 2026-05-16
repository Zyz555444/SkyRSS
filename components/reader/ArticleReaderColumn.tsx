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
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-[color:var(--background)]",
        "min-h-[min(70dvh,560px)] lg:min-h-0",
        !isLargeScreen && (!item || !mobileShowReader) && "hidden",
      )}
    >
      {item ? (
        <>
          {/* 文章头部 - 粘性定位 */}
          <div className="sticky top-0 z-10 shrink-0 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] px-6 py-5 backdrop-blur-xl">
            {/* 移动端返回按钮 */}
            {!isLargeScreen && mobileShowReader ? (
              <GlassButton
                type="button"
                className="mb-3 w-full sm:w-auto"
                onClick={onBack}
              >
                <span className="mr-2">←</span>
                返回列表
              </GlassButton>
            ) : null}
            
            {/* 文章来源和日期 */}
            <div className="mb-3 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] px-2.5 py-1 font-semibold text-white shadow-sm">
                {item.feedTitle}
              </span>
              {activeDateLabel ? (
                <span className="text-[color:var(--muted-foreground)]">
                  {activeDateLabel}
                </span>
              ) : null}
            </div>
            
            {/* 文章标题 */}
            <h1 className="text-2xl font-bold leading-snug text-[color:var(--text)]">
              {item.title}
            </h1>
            
            {/* 作者信息 */}
            {item.author ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-[color:var(--muted)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)] text-white font-medium shadow-md">
                  {item.author.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{item.author}</span>
              </div>
            ) : null}
          </div>

          {/* 文章正文 */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-[color:var(--secondary)]/30">
            <div className="article-reading-shell px-6 py-6">
              <div className="article-body animate-fade-in">
                <ArticleBody
                  html={item.contentHtml}
                  fallbackSnippet={item.contentSnippet}
                />
              </div>
            </div>
          </div>

          {/* 原文链接按钮 */}
          {item.link ? (
            <div className="shrink-0 border-t border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)] px-6 py-4 backdrop-blur-xl">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="reader-gradient-cta group flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[color:var(--primary-glow)] transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
              >
                <span>在浏览器中打开原文</span>
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          ) : null}
        </>
      ) : (
        /* 空状态 */
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-[color:var(--primary-glow)] opacity-20" />
            <div className="relative text-6xl animate-float">📖</div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide gradient-text">
              沉浸式阅读
            </p>
            <p className="mt-3 text-base text-[color:var(--muted)]">
              在左侧列表中选择一篇文章<br />开始优雅的阅读体验
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[color:var(--accent)] to-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-400 to-[color:var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </section>
  );
}
