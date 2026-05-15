export type ReaderNav =
  | { kind: "all" }
  | { kind: "folder"; folderId: string }
  | { kind: "source"; sourceId: string }
  | { kind: "read_later" }
  | { kind: "favorites" }
  | { kind: "recent" };
