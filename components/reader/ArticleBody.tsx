"use client";

import { useLayoutEffect, useRef, useEffect } from "react";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";

function applyKatex(root: HTMLElement) {
  renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
      {
        left: "\\begin{equation}",
        right: "\\end{equation}",
        display: true,
      },
      { left: "\\begin{align}", right: "\\end{align}", display: true },
      { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
      { left: "\\begin{gather}", right: "\\end{gather}", display: true },
      { left: "\\begin{CD}", right: "\\end{CD}", display: true },
    ],
    ignoredTags: [
      "script",
      "noscript",
      "style",
      "textarea",
      "pre",
      "code",
      "option",
      "math",
    ],
    ignoredClasses: ["katex", "katex-display", "katex-mathml"],
    throwOnError: false,
    strict: "ignore",
    errorCallback: () => {},
  });
}

function lazyLoadImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return undefined;

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
        img.loading = "eager";
        imageObserver.unobserve(img);
      });
    },
    { rootMargin: "50px 0px", threshold: 0.01 },
  );

  images.forEach((img) => {
    if (!img.loading) {
      img.loading = "lazy";
    }
    if (!img.dataset.src && img.src) {
      img.dataset.src = img.src;
      img.src = "";
    }
    if (img.dataset.src || !img.src) {
      imageObserver.observe(img);
    }
  });

  return () => imageObserver.disconnect();
}

function processLazyImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return;
  images.forEach((img) => {
    if (!img.loading) {
      img.loading = "lazy";
    }
    if (img.src && !img.dataset.src) {
      img.dataset.src = img.src;
      img.src = "";
    }
  });
}

type ArticleBodyProps = {
  html?: string;
  fallbackSnippet?: string;
};

/**
 * 渲染 RSS 正文 HTML 或纯文本摘要，并在客户端对常见 LaTeX 定界符做 KaTeX 排版。
 * 原生 MathML（math 元素）由浏览器绘制，KaTeX 会跳过 math 子树以免破坏。
 */
export function ArticleBody({ html, fallbackSnippet }: ArticleBodyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const prevHtmlRef = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || html === prevHtmlRef.current) return;
    
    applyKatex(root);
    processLazyImages(root);
    prevHtmlRef.current = html;
  }, [html]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (html !== prevHtmlRef.current) return undefined;
    return lazyLoadImages(root);
  }, [html]);

  if (html) {
    return (
      <div ref={rootRef} className="article-body">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  const text =
    fallbackSnippet?.trim() ||
    "（此条目无摘要与正文 HTML，可能仅在原站提供全文。）";

  return (
    <div ref={rootRef} className="article-body space-y-3">
      <p className="whitespace-pre-wrap text-[color:var(--text)]">{text}</p>
      <p className="text-xs text-[color:var(--muted)]">
        部分订阅源仅在 RSS
        中提供摘要；纯文本摘要无法显示加粗等格式。若需原站样式，请使用下方按钮。
      </p>
    </div>
  );
}
