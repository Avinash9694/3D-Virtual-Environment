export interface ProgressItem {
  loaded: number;
  total: number;
}

export interface ProgressSnapshot {
  fraction: number;
  loadedBytes: number;
  totalBytes: number;
  completed: number;
  count: number;
}

/**
 * Aggregates several in-flight downloads into one 0..1 figure.
 * Items whose total is still unknown are weighted by `fallbackTotal`,
 * so the bar cannot run backwards when a late Content-Length arrives.
 */
export function aggregateProgress(
  items: Iterable<ProgressItem>,
  fallbackTotal = 1_000_000,
): ProgressSnapshot {
  let loadedBytes = 0;
  let totalBytes = 0;
  let completed = 0;
  let count = 0;
  for (const item of items) {
    count += 1;
    const total = item.total > 0 ? item.total : Math.max(fallbackTotal, item.loaded);
    const loaded = Math.min(item.loaded, total);
    loadedBytes += loaded;
    totalBytes += total;
    if (item.total > 0 && item.loaded >= item.total) completed += 1;
  }
  const fraction = count === 0 ? 0 : totalBytes === 0 ? 0 : clamp01(loadedBytes / totalBytes);
  return { fraction, loadedBytes, totalBytes, completed, count };
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
