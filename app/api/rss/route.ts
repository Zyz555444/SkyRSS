import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { normalizeFeedUrlInput } from "@/lib/normalize-feed-url";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS = 50;

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
        Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
        "User-Agent": "Mozilla/5.0 (compatible; RSS-Reader/1.0; +https://example.local)",
      },
    });
  } finally {
    clearTimeout(timer);
  }
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

    const items = (feed.items ?? []).slice(0, MAX_ITEMS).map((item) => ({
      title: (item.title && String(item.title).trim()) || "（无标题）",
      link: item.link ? String(item.link) : undefined,
      pubDate: item.pubDate ? String(item.pubDate) : undefined,
      contentSnippet: item.contentSnippet
        ? String(item.contentSnippet).slice(0, 2000)
        : undefined,
    }));

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
    const message =
      err instanceof Error ? err.message : "未知错误";
    const aborted =
      err instanceof Error && err.name === "AbortError";
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
