/** JSON returned by GET /api/rss */
export type RssItemJson = {
  title: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
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
