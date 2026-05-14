"use client";

import { useLayoutEffect, useRef } from "react";
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

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    applyKatex(root);
  }, [html, fallbackSnippet]);

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
