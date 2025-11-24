import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { NetworkFirst, CacheFirst } from "@serwist/strategies";
import { ExpirationPlugin } from "@serwist/expiration";

// This declares the value of `injectionPoint` to typescript.
// `injectionPoint` is the string that will be replaced by the actual precache manifest.
// By default, this string is set to `"self.__WB_MANIFEST"`.
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // API routes - NetworkFirst strategy (fresh data when online, fallback to cache)
        {
            matcher: ({ url }) => url.pathname.startsWith('/api/deals') || url.pathname.startsWith('/api/merchants'),
            handler: new NetworkFirst({
                cacheName: 'api-cache',
                plugins: [
                    new ExpirationPlugin({
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                        maxEntries: 50,
                    }),
                ],
            }),
        },
        // Next.js Image Optimization - CacheFirst strategy (images rarely change)
        {
            matcher: ({ url }) => url.pathname.startsWith('/_next/image'),
            handler: new CacheFirst({
                cacheName: 'image-cache',
                plugins: [
                    new ExpirationPlugin({
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                        maxEntries: 100,
                    }),
                ],
            }),
        },
        // Marketplace page - NetworkFirst strategy
        {
            matcher: ({ url }) => url.pathname.startsWith('/dashboard/employee/marketplace'),
            handler: new NetworkFirst({
                cacheName: 'page-cache',
                plugins: [
                    new ExpirationPlugin({
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                        maxEntries: 20,
                    }),
                ],
            }),
        },
    ],
});

serwist.addEventListeners();
