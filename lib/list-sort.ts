export type ListSortMode = "time" | "unread";

const SORT_KEY = "skyrss-list-sort";

export function getListSortMode(): ListSortMode {
  if (typeof window === "undefined") return "time";
  try {
    const v = window.localStorage.getItem(SORT_KEY);
    return v === "unread" ? "unread" : "time";
  } catch {
    return "time";
  }
}

export function setListSortMode(mode: ListSortMode) {
  try {
    window.localStorage.setItem(SORT_KEY, mode);
  } catch {
    /* ignore */
  }
}
