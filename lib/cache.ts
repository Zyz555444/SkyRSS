"use client";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

type CacheConfig = {
  ttl?: number;
  maxEntries?: number;
};

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl ?? 5 * 60 * 1000,
      maxEntries: config.maxEntries ?? 100,
    };
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.config.ttl!) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    if (this.cache.size >= this.config.maxEntries!) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now() } as CacheEntry<T>);
  }

  getPending<T>(key: string): Promise<T> | null {
    return (this.pendingRequests.get(key) as Promise<T>) || null;
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }
}

export const rssCache = new RequestCache({
  ttl: 5 * 60 * 1000,
  maxEntries: 100,
});

export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
): Promise<T> {
  const key = cacheKey || `fetch:${url}:${JSON.stringify(options)}`;

  const cached = rssCache.get<T>(key);
  if (cached) {
    return cached;
  }

  const pending = rssCache.getPending<T>(key);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    rssCache.set(key, data);
    return data;
  })();

  rssCache.setPending(key, promise);
  return promise;
}

export function createCacheKey(prefix: string, ...args: (string | number | undefined | null)[]) {
  return `${prefix}:${args.filter(Boolean).join(":")}`;
}

export function shouldRefresh(cacheTimestamp: number, ttl: number): boolean {
  return Date.now() - cacheTimestamp > ttl;
}

export function prefetchOnIdle(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      cachedFetch(url, options, cacheKey).catch(console.warn);
    });
  } else {
    setTimeout(() => {
      cachedFetch(url, options, cacheKey).catch(console.warn);
    }, 100);
  }
}

export function prefetchNextPage<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        cachedFetch<T>(url, options, cacheKey).catch(console.warn);
      },
      { timeout: 1000 },
    );
  }
}

const prefetchQueue: Array<() => void> = [];
let isProcessing = false;

export function queuePrefetch(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
): void {
  prefetchQueue.push(() => {
    cachedFetch(url, options, cacheKey).catch(console.warn);
  });
  if (!isProcessing) {
    processPrefetchQueue();
  }
}

async function processPrefetchQueue(): Promise<void> {
  if (prefetchQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const task = prefetchQueue.shift();
  if (task) {
    task();
    await new Promise((resolve) => setTimeout(resolve, 500));
    processPrefetchQueue();
  }
}
