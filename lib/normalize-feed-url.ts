/**
 * 纠正订阅地址里常见的协议拼写错误（如 `htts://`），再交给 `URL` 解析。
 */
export function normalizeFeedUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .replace(/^htts:\/\//i, "https://")
    .replace(/^htttps:\/\//i, "https://")
    .replace(/^htps:\/\//i, "https://")
    .replace(/^httpss:\/\//i, "https://");
}
