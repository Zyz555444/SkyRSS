import Parser from "rss-parser";
import { normalizeFeedUrlInput } from "@/lib/normalize-feed-url";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS = 50;

export function validateFeedUrl(raw: string | null): URL | null {
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

const parser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
});

export type RssFeedPayload = {
  title: string;
  description: string;
  link: string;
  items: {
    title: string;
    link?: string;
    pubDate?: string;
    contentSnippet?: string;
  }[];
};

export async function fetchRssFeedPayload(
  feedUrl: URL,
): Promise<RssFeedPayload> {
  const res = await fetchWithTimeout(feedUrl, FETCH_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`远程返回 ${res.status} ${res.statusText}`);
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

  return {
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
}
