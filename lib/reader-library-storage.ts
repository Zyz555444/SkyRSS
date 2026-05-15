import { z } from "zod";

const LIBRARY_KEY = "rss-reader-library-v1";
const LEGACY_FEEDS_KEY = "rss-reader-feeds-v1";

const listeners = new Set<() => void>();

let cache: ReaderLibrary | null = null;

export const storedFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sortOrder: z.number().int(),
});

export type StoredFolder = z.infer<typeof storedFolderSchema>;

export const storedFeedSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  folderId: z.string().min(1).nullable().optional(),
});

export type StoredFeed = z.infer<typeof storedFeedSchema>;

export const storedReaderItemSchema = z.object({
  subscriptionId: z.string().min(1),
  itemKey: z.string().min(1),
  title: z.string(),
  link: z.string().nullable().optional(),
  snippet: z.string().nullable().optional(),
  feedTitle: z.string(),
  readAt: z.number().int().nullable().optional(),
  favorite: z.boolean(),
  readLater: z.boolean(),
  lastOpenedAt: z.number().int().nullable().optional(),
  updatedAt: z.number().int().nonnegative(),
});

export type StoredReaderItem = z.infer<typeof storedReaderItemSchema>;

const librarySchema = z.object({
  version: z.literal(1),
  folders: z.array(storedFolderSchema),
  feeds: z.array(storedFeedSchema),
  readerItems: z.array(storedReaderItemSchema),
});

export type ReaderLibrary = z.infer<typeof librarySchema>;

const legacyFeedsArraySchema = z.array(
  z.object({
    id: z.string().min(1),
    url: z.string().url(),
    title: z.string().min(1),
    createdAt: z.number().int().nonnegative(),
  }),
);

function emit() {
  listeners.forEach((l) => l());
}

function readFromDisk(): ReaderLibrary {
  if (typeof window === "undefined") {
    return emptyLibrary();
  }
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const result = librarySchema.safeParse(parsed);
      if (result.success) return result.data;
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_FEEDS_KEY);
    if (legacyRaw) {
      const legacyParsed: unknown = JSON.parse(legacyRaw);
      const legacy = legacyFeedsArraySchema.safeParse(legacyParsed);
      if (legacy.success) {
        const migrated: ReaderLibrary = {
          version: 1,
          folders: [],
          feeds: legacy.data.map((f) => ({
            ...f,
            folderId: null,
          })),
          readerItems: [],
        };
        writeToDisk(migrated);
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return emptyLibrary();
}

function emptyLibrary(): ReaderLibrary {
  return { version: 1, folders: [], feeds: [], readerItems: [] };
}

function writeToDisk(lib: ReaderLibrary): void {
  if (typeof window === "undefined") return;
  const validated = librarySchema.safeParse(lib);
  if (!validated.success) return;
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(validated.data));
  cache = validated.data;
  emit();
}

export function subscribeLibrary(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getLibrarySnapshot(): ReaderLibrary {
  if (typeof window === "undefined") return emptyLibrary();
  if (cache === null) {
    cache = readFromDisk();
  }
  return cache;
}

export function getServerLibrarySnapshot(): ReaderLibrary {
  return emptyLibrary();
}

export function saveLibrary(next: ReaderLibrary): void {
  writeToDisk(next);
}

export function updateLibrary(
  fn: (prev: ReaderLibrary) => ReaderLibrary,
): ReaderLibrary {
  const prev = getLibrarySnapshot();
  const next = fn(prev);
  writeToDisk(next);
  return next;
}

/** 与旧 `subscribeFeeds` 兼容：订阅同一存储 */
export function subscribeFeeds(onStoreChange: () => void): () => void {
  return subscribeLibrary(onStoreChange);
}

export function getFeedsSnapshot(): StoredFeed[] {
  return getLibrarySnapshot().feeds;
}

export function getServerFeedsSnapshot(): StoredFeed[] {
  return [];
}

export function saveFeeds(feeds: StoredFeed[]): void {
  updateLibrary((lib) => ({ ...lib, feeds }));
}

export function readerItemCompositeKey(
  subscriptionId: string,
  itemKey: string,
): string {
  return `${subscriptionId}\0${itemKey}`;
}

export function upsertLocalReaderItems(
  patches: StoredReaderItem[],
): ReaderLibrary {
  return updateLibrary((lib) => {
    const map = new Map<string, StoredReaderItem>();
    for (const row of lib.readerItems) {
      map.set(readerItemCompositeKey(row.subscriptionId, row.itemKey), row);
    }
    for (const row of patches) {
      map.set(readerItemCompositeKey(row.subscriptionId, row.itemKey), {
        ...row,
        updatedAt: Date.now(),
      });
    }
    return { ...lib, readerItems: Array.from(map.values()) };
  });
}

export function newLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
