import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "address",
  "article",
  "aside",
  "b",
  "blockquote",
  "br",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "samp",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "var",
  "wbr",
];

/** 常见 RSS/博客用内联样式表达加粗、对齐等；在严格白名单下保留 */
const ALLOWED_STYLES: NonNullable<sanitizeHtml.IOptions["allowedStyles"]> = {
  "*": {
    "font-weight": [
      /^bold$/i,
      /^bolder$/i,
      /^lighter$/i,
      /^normal$/i,
      /^inherit$/i,
      /^\d{2,4}$/,
    ],
    "font-style": [/^normal$/i, /^italic$/i, /^oblique$/i],
    "text-decoration": [
      /^none$/i,
      /^underline(?:\s|$)/i,
      /^line-through(?:\s|$)/i,
      /^overline(?:\s|$)/i,
    ],
    "text-align": [/^left$/i, /^right$/i, /^center$/i, /^justify$/i],
    "color": [
      /^#[0-9a-f]{3,8}$/i,
      /^rgb\s*\(\s*[\d.%\s,]+\)$/i,
      /^rgba\s*\(\s*[\d.%\s,]+\)$/i,
    ],
  },
};

const TAGS_WITH_STYLE = [
  "article",
  "aside",
  "blockquote",
  "div",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "p",
  "section",
  "span",
  "td",
  "th",
] as const;

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "rel", "target", "title"],
  img: ["alt", "height", "loading", "src", "title", "width"],
  td: ["colspan", "rowspan", "class", "id", "style"],
  th: ["colspan", "rowspan", "class", "id", "style"],
  "*": ["class", "id"],
};

for (const tag of TAGS_WITH_STYLE) {
  if (tag === "td" || tag === "th") continue;
  ALLOWED_ATTRIBUTES[tag] = ["class", "id", "style"];
}

/**
 * 清洗第三方 RSS 正文 HTML，供客户端安全渲染。
 */
export function sanitizeArticleHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return sanitizeHtml(trimmed, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
  });
}
