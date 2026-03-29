export function optimizeUnsplashUrl(url, options = {}) {
  const { w = 700, q = 80, format = 'webp' } = options;

  if (!url || typeof url !== 'string') {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const isUnsplashHost =
      host.includes('unsplash.com') ||
      host.includes('images.unsplash.com');

    if (!isUnsplashHost) {
      return url;
    }

    parsedUrl.searchParams.set('w', String(w));
    parsedUrl.searchParams.set('q', String(q));
    parsedUrl.searchParams.set('format', format);
    parsedUrl.searchParams.set('fm', format);
    parsedUrl.searchParams.set('fit', 'crop');

    return parsedUrl.toString();
  } catch (_error) {
    return url;
  }
}
