/** JSON returned by GET /api/rss */
export type RssItemJson = {
  title: string;
  link?: string;
  /** 稳定标识，用于列表 key 与选中态（部分源提供） */
  guid?: string;
  pubDate?: string;
  /** ISO 8601，便于格式化展示 */
  isoDate?: string;
  categories?: string[];
  author?: string;
  contentSnippet?: string;
  /** 已在服务端白名单清洗的 HTML，可配合 dangerouslySetInnerHTML */
  contentHtml?: string;
};

/** 合并多源后的列表视图：在 RssItemJson 上注入订阅维度 */
export type RssItemView = RssItemJson & {
  subscriptionId: string;
  feedTitle: string;
  itemKey: string;
};

export type RssFeedJson = {
  title: string;
  description: string;
  link?: string;
  items: RssItemJson[];
};

export type RssApiErrorJson = {
  error: string;
};
