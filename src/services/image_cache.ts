/**
 * High-performance client-side image cache and preloader.
 * Uses browser CacheStorage API and in-memory Object URLs for instant image rendering.
 */

const CACHE_NAME = 'lamistock-image-cache-v1';
const memoryUrlCache = new Map<string, string>();
const preloadedUrls = new Set<string>();

/**
 * Check if the browser supports the CacheStorage API
 */
function isCacheSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'caches' in window && Boolean(window.caches);
  } catch {
    return false;
  }
}

/**
 * Preloads an image into the browser's memory and CacheStorage.
 * Resolves silently on network error without interrupting UI.
 */
export async function preloadImage(url?: string): Promise<void> {
  if (!url || !url.trim() || url.startsWith('data:')) {
    return;
  }

  if (preloadedUrls.has(url)) {
    return;
  }

  preloadedUrls.add(url);

  // Pre-decode using Image object for instant layout paint
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    if (typeof (img as any).decode === 'function') {
      img.decode().catch(() => {});
    }
  } catch {
    // Ignore decode errors on unsupported environments
  }

  // Persist to CacheStorage if supported for subsequent offline or instant loads
  if (isCacheSupported()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(url);
      if (!matched) {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch {
      // Ignore network / CORS fetch failures during background prefetch
    }
  }
}

/**
 * Retrieves a fast local blob URL for a cached remote image, or returns original url.
 */
export async function getCachedImageUrl(url?: string): Promise<string> {
  if (!url || !url.trim() || url.startsWith('data:')) {
    return url || '';
  }

  if (memoryUrlCache.has(url)) {
    return memoryUrlCache.get(url)!;
  }

  if (isCacheSupported()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const objectUrl = URL.createObjectURL(blob);
        memoryUrlCache.set(url, objectUrl);
        return objectUrl;
      }
    } catch {
      // Fallback to original url
    }
  }

  return url;
}

/**
 * Preload back-face and secondary images in background idle time
 */
export function scheduleIdlePreload(urls: string[]): void {
  if (typeof window === 'undefined') return;

  const validUrls = urls.filter((u) => u && !u.startsWith('data:') && !preloadedUrls.has(u));
  if (validUrls.length === 0) return;

  const runTask = () => {
    validUrls.forEach((u) => {
      preloadImage(u).catch(() => {});
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runTask, { timeout: 2000 });
  } else {
    setTimeout(runTask, 300);
  }
}
