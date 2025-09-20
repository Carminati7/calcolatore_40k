// Service Worker: Cache-first with background refresh (stale-while-revalidate)
// - Responds immediately from cache when available
// - Fetches from network in background and refreshes cache
// - Precaches critical assets on install and cleans old caches on activate

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `calcolatore-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
    '/calcolatore_40k/',            // root (GitHub Pages base)
    '/calcolatore_40k/index.html',
    '/calcolatore_40k/docs.html',
    '/calcolatore_40k/changelog.html',
    '/calcolatore_40k/CHANGELOG.md',
    '/calcolatore_40k/README.md',
    '/calcolatore_40k/assets/style-common.css',
    '/calcolatore_40k/assets/style-index.css',
    '/calcolatore_40k/assets/style-docs.css',
    '/calcolatore_40k/assets/style-changelog.css',
    '/calcolatore_40k/assets/nav.js',
    // add other critical assets here (icons, fonts) if present
];

// Utility: attempt to open cache and add all precache urls
async function precache() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
}

// Clean up old caches not matching CACHE_NAME
async function cleanOldCaches() {
    const keys = await caches.keys();
    await Promise.all(
        keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
    );
}

// Install: precache critical assets and take control on skipWaiting
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            try {
                await precache();
            } catch (err) {
                // swallow; install should not fail permanently for non-critical precache misses
                console.warn('SW precache failed:', err);
            }
            // activate immediately after install
            await self.skipWaiting();
        })()
    );
});

// Activate: cleanup and claim clients
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            await cleanOldCaches();
            await self.clients.claim();
        })()
    );
});

/*
 Fetch handler: Cache-first with background refresh (stale-while-revalidate)
 - For GET same-origin requests:
   1) Try to find cached response and return it immediately if present.
   2) Start a network fetch in background; if successful, update the cache.
   3) If no cached response, wait for the network response (fallback).
 - For navigation requests, prefer cache but fallback to network.
*/
self.addEventListener('fetch', event => {
    const request = event.request;

    // Only handle GET requests; let others pass through
    if (request.method !== 'GET') return;

    // Only handle same-origin requests for cache strategies
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Edge: tolerate mode 'navigate' or HTML requests and provide fallback if needed
    event.respondWith(handleRequest(request, event));
});

async function handleRequest(request, event) {
    const cache = await caches.open(CACHE_NAME);

    // Try to find a cached response
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Kick off a background refresh but don't block the response
        const refreshPromise = refreshCache(request, cache);
        // Inform SW that work is ongoing so it won't be terminated immediately
        event.waitUntil(refreshPromise);
        return cachedResponse;
    }

    // No cache: try network, fall back to cache if network fails
    try {
        const networkResponse = await fetchAndCache(request, cache);
        if (networkResponse) return networkResponse;
    } catch (err) {
        // network failed; try a navigation fallback or generic offline response
        const fallback = await cache.match('/calcolatore_40k/index.html') || cache.match('/calcolatore_40k/changelog.html');
        if (fallback) return fallback;
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

/*
 Fetch from network and put into the cache (used for initial fetch and refresh).
 Returns the network response (or throws).
*/
async function fetchAndCache(request, cache) {
    const networkResponse = await fetch(request);
    // Only cache successful responses (200-299)
    if (networkResponse && networkResponse.ok) {
        // Clone before caching because response body can be used only once
        await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}

/*
 Refresh the cache for a given request in the background.
 Implements a best-effort network fetch and updates the cache if successful.
*/
async function refreshCache(request, cache) {
    try {
        // Use a network-only fetch (no-cache) to ensure fresh content
        const networkResponse = await fetch(request, { cache: 'no-store' });
        if (networkResponse && networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
    } catch (err) {
        // silently ignore network errors during background refresh
        // (could be offline or transient)
    }
}

// Optional message interface to allow clients to trigger skipWaiting or cache refresh
self.addEventListener('message', event => {
    const data = event.data || {};
    if (data && data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (data && data.type === 'REFRESH_CACHE') {
        // Client requests a manual cache refresh for current scope
        event.waitUntil(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                await Promise.all(
                    PRECACHE_URLS.map(url => fetchAndCache(new Request(url), cache).catch(() => {}))
                );
            })()
        );
    }
});
