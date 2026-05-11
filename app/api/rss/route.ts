import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { normalizeFeedUrlInput } from "@/lib/normalize-feed-url";
import { sanitizeArticleHtml } from "@/lib/sanitize-article-html";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS = 50;
const MAX_CONTENT_HTML_CHARS = 200_000;
const MAX_SNIPPET_CHARS = 2000;

function validateFeedUrl(raw: string | null): URL | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = normalizeFeedUrlInput(raw);
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }
  return parsed;
}

async function fetchWithTimeout(
  target: URL,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept:
          "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
        "User-Agent":
          "Mozilla/5.0 (compatible; RSS-Reader/1.0; +https://example.local)",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** rss-parser 条目上除声明字段外，还可能出现 content:encoded 等键 */
type ParserItem = Record<string, unknown> & {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  author?: string;
  content?: string;
  contentSnippet?: string;
  categories?: unknown;
};

function normalizeCategories(raw: unknown): string[] {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of list) {
    let s: string;
    if (typeof c === "string") {
      s = c.trim();
    } else if (typeof c === "object" && c !== null && "_" in c) {
      s = String((c as { _: string })._).trim();
    } else {
      continue;
    }
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function pickAuthor(item: ParserItem): string | undefined {
  const c = item.creator;
  if (typeof c === "string" && c.trim()) return c.trim();
  const a = item.author;
  if (typeof a === "string" && a.trim()) return a.trim();
  return undefined;
}

function pickGuid(item: ParserItem): string | undefined {
  const g = item.guid;
  if (typeof g === "string" && g.trim()) return g.trim();
  return undefined;
}

/**
 * RSS 2.0 常在 content:encoded 放全文；description 会覆盖 item.content，
 * 故全文应优先取 content:encoded。
 */
function pickRawHtmlBody(item: ParserItem): string | undefined {
  const encoded = item["content:encoded"];
  if (typeof encoded === "string" && encoded.trim()) return encoded;
  const content = item.content;
  if (typeof content === "string" && content.trim()) return content;
  return undefined;
}

const parser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedUrl = validateFeedUrl(searchParams.get("url"));

  if (!feedUrl) {
    return NextResponse.json(
      { error: "无效的订阅地址，请使用 http(s) URL。" },
      { status: 400 },
    );
  }

  try {
    const res = await fetchWithTimeout(feedUrl, FETCH_TIMEOUT_MS);
    if (!res.ok) {
      return NextResponse.json(
        { error: `拉取失败：远程返回 ${res.status} ${res.statusText}` },
        { status: 502 },
      );
    }
    const xml = await res.text();
    const feed = await parser.parseString(xml);

    const items = (feed.items ?? []).slice(0, MAX_ITEMS).map((raw) => {
      const item = raw as ParserItem;
      const title =
        (item.title && String(item.title).trim()) || "（无标题）";
      const link = item.link ? String(item.link) : undefined;
      const guid = pickGuid(item);
      const pubDate = item.pubDate ? String(item.pubDate) : undefined;
      const isoDate = item.isoDate ? String(item.isoDate) : undefined;
      const categories = normalizeCategories(item.categories);
      const author = pickAuthor(item);

      const snippetSource =
        typeof item.contentSnippet === "string"
          ? item.contentSnippet
          : undefined;
      const contentSnippet = snippetSource
        ? String(snippetSource).slice(0, MAX_SNIPPET_CHARS)
        : undefined;

      const rawBody = pickRawHtmlBody(item);
      let contentHtml: string | undefined;
      if (rawBody) {
        const sliceEnd = Math.min(rawBody.length, MAX_CONTENT_HTML_CHARS);
        const clipped = rawBody.slice(0, sliceEnd);
        const cleaned = sanitizeArticleHtml(clipped);
        if (cleaned) contentHtml = cleaned;
      }

      return {
        title,
        link,
        guid,
        pubDate,
        isoDate,
        categories: categories.length ? categories : undefined,
        author,
        contentSnippet,
        contentHtml,
      };
    });

    const payload = {
      title:
        (feed.title && String(feed.title).trim()) ||
        feedUrl.hostname ||
        "未命名订阅",
      description: feed.description
        ? String(feed.description).slice(0, 500)
        : "",
      link: feed.link ? String(feed.link) : feedUrl.toString(),
      items,
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted
          ? "请求超时，请稍后重试或检查订阅源。"
          : `解析或拉取失败：${message}`,
      },
      { status: 502 },
    );
  }
}
