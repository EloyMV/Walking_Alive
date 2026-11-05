export function normalizeImageUrls(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value.map((url) => typeof url === 'string' ? url.trim() : '');
}

export function isHttpImageUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}
