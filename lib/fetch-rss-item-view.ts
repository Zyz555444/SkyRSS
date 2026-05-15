import { computeItemKey } from "@/lib/item-key";
import { fetchFeedJsonClient } from "@/lib/merge-feed-items";
import type { RssItemView } from "@/types/rss";

export async function fetchRssItemViewForSubscription(
  subscription: { id: string; url: string; title: string },
  itemKey: string,
): Promise<RssItemView | null> {
  const feed = await fetchFeedJsonClient(subscription.url);
  const feedTitle = feed.title?.trim() || subscription.title;
  for (const raw of feed.items) {
    if (computeItemKey(raw) === itemKey) {
      return {
        ...raw,
        subscriptionId: subscription.id,
        feedTitle,
        itemKey,
      };
    }
  }
  return null;
}
