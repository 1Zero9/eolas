# PWA shell

1. Add icons at `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`.
2. Link the manifest and set `theme-color` in your root layout `<head>`.
3. Mount `<ServiceWorkerRegistration />` once near the root layout.
4. Bump `CACHE_NAME` in `sw.js` whenever cached assets change, to force clients to refresh.
