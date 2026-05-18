/** نام باکت S3 در پارس‌پک معمولاً همان شناسهٔ c123456 در endpoint است. */

export function parseEndpointHost(endpoint: string): string | null {
  const trimmed = endpoint.trim();
  try {
    const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export function getParsPackBucketHintFromEndpoint(endpoint: string): string | null {
  const host = parseEndpointHost(endpoint);
  if (!host) return null;
  const match = host.match(/^(c\d+)\.parspack\.net$/i);
  return match?.[1] ?? null;
}
