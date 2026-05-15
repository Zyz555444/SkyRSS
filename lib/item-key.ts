import type { RssItemJson } from "@/types/rss";

function simpleHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/**
 * 跨会话稳定的条目键：优先 guid，其次 link，否则标题+日期摘要。
 */
export function computeItemKey(item: RssItemJson): string {
  const g = item.guid?.trim();
  if (g) return `g:${g}`;
  const link = item.link?.trim();
  if (link) return `l:${link}`;
  const date = item.isoDate || item.pubDate || "";
  return `h:${simpleHash(`${item.title}\0${date}`)}`;
}

export function itemsMatchKey(
  a: Pick<RssItemJson, "guid" | "link" | "title" | "isoDate" | "pubDate">,
  b: Pick<RssItemJson, "guid" | "link" | "title" | "isoDate" | "pubDate">,
): boolean {
  return computeItemKey(a as RssItemJson) === computeItemKey(b as RssItemJson);
}
