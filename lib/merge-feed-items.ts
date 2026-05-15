import { normalizeFeedUrlInput } from "@/lib/normalize-feed-url";
import { computeItemKey } from "@/lib/item-key";
import { getItemTimestamp } from "@/lib/format-relative-time";
import type { RssApiErrorJson, RssFeedJson, RssItemView } from "@/types/rss";

export type SubscriptionRef = {
  id: string;
  url: string;
  title: string;
};

export type FetchFeedFn = (url: string) => Promise<RssFeedJson>;

export type MergedFetchResult = {
  items: RssItemView[];
  errors: { subscriptionId: string; title: string; message: string }[];
};

const DEFAULT_CONCURRENCY = 4;

async function mapInChunks<T, R>(
  items: T[],
  chunkSize: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const part = await Promise.all(chunk.map((x) => mapper(x)));
    out.push(...part);
  }
  return out;
}

export async function fetchFeedJsonClient(url: string): Promise<RssFeedJson> {
  const normalized = normalizeFeedUrlInput(url);
  const api = `/api/rss?url=${encodeURIComponent(normalized)}`;
  const res = await fetch(api);
  const data: unknown = await res.json();
  if (!res.ok) {
    const err = data as RssApiErrorJson;
    throw new Error(err.error || "加载失败");
  }
  return data as RssFeedJson;
}

/**
 * 并行拉取多个订阅（分块并发），合并条目并按发布时间降序。
 */
export async function mergeFeedItems(
  subscriptions: SubscriptionRef[],
  options?: { fetchFeed?: FetchFeedFn; concurrency?: number },
): Promise<MergedFetchResult> {
  const fetchFeed = options?.fetchFeed ?? fetchFeedJsonClient;
  const concurrency = Math.max(
    1,
    Math.min(8, options?.concurrency ?? DEFAULT_CONCURRENCY),
  );

  if (subscriptions.length === 0) {
    return { items: [], errors: [] };
  }

  const errors: MergedFetchResult["errors"] = [];

  const payloads = await mapInChunks(
    subscriptions,
    concurrency,
    async (sub) => {
      try {
        const feed = await fetchFeed(sub.url);
        return { sub, feed, error: null as string | null };
      } catch (e) {
        const message = e instanceof Error ? e.message : "加载失败";
        errors.push({
          subscriptionId: sub.id,
          title: sub.title,
          message,
        });
        return { sub, feed: null, error: message };
      }
    },
  );

  const items: RssItemView[] = [];
  for (const { sub, feed } of payloads) {
    if (!feed) continue;
    const feedTitle = feed.title?.trim() || sub.title;
    for (const raw of feed.items) {
      const itemKey = computeItemKey(raw);
      items.push({
        ...raw,
        subscriptionId: sub.id,
        feedTitle,
        itemKey,
      });
    }
  }

  items.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));

  return { items, errors };
}
