export function feedFaviconUrl(feedUrl: string, fallbackIndex = 0): string {
  try {
    const host = new URL(feedUrl).hostname;
    const domains = [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
      `https://icon.horse/icon/${host}`,
      `https://fav.farm/${host}`,
    ];
    const index = Math.min(fallbackIndex, domains.length - 1);
    return domains[index];
  } catch {
    return "";
  }
}

export function getFaviconSources(feedUrl: string): string[] {
  try {
    const host = new URL(feedUrl).hostname;
    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
      `https://icon.horse/icon/${host}`,
      `https://fav.farm/${host}`,
    ];
  } catch {
    return [];
  }
}
