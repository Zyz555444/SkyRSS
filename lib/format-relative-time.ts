const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;
const MS_DAY = 24 * MS_HOUR;

/**
 * 中文相对时间：刚刚 / N 分钟前 / 昨天 HH:mm 等
 */
export function formatRelativeTimeZh(
  isoOrPub: string | undefined,
): string | null {
  if (!isoOrPub) return null;
  const t = new Date(isoOrPub).getTime();
  if (Number.isNaN(t)) return null;
  const now = Date.now();
  const diff = now - t;
  if (diff < 0) return "刚刚";
  if (diff < 45_000) return "刚刚";
  if (diff < MS_HOUR) {
    const m = Math.max(1, Math.floor(diff / MS_MIN));
    return `${m} 分钟前`;
  }
  if (diff < MS_DAY) {
    const h = Math.max(1, Math.floor(diff / MS_HOUR));
    return `${h} 小时前`;
  }
  const days = Math.floor(diff / MS_DAY);
  if (days === 1) {
    return `昨天 ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(t))}`;
  }
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t));
}

export function getItemTimestamp(item: {
  isoDate?: string;
  pubDate?: string;
}): number {
  const raw = item.isoDate || item.pubDate;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}
