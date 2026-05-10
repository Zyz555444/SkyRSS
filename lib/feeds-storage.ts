import { z } from "zod";

const STORAGE_KEY = "rss-reader-feeds-v1";

export const storedFeedSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
});

export type StoredFeed = z.infer<typeof storedFeedSchema>;

const feedsArraySchema = z.array(storedFeedSchema);

const listeners = new Set<() => void>();

let cache: StoredFeed[] | null = null;

function readFromDisk(): StoredFeed[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const result = feedsArraySchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function subscribeFeeds(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  listeners.add(onStoreChange);

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cache = null;
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getFeedsSnapshot(): StoredFeed[] {
  if (typeof window === "undefined") return [];
  if (cache === null) {
    cache = readFromDisk();
  }
  return cache;
}

export function getServerFeedsSnapshot(): StoredFeed[] {
  return [];
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function saveFeeds(feeds: StoredFeed[]): void {
  if (typeof window === "undefined") return;
  const validated = feedsArraySchema.safeParse(feeds);
  if (!validated.success) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(validated.data),
  );
  cache = validated.data;
  emit();
}
