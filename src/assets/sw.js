/*
 * Tombstone service worker.
 *
 * The deployed Backbone build registers an offline-plugin service worker at
 * this exact path (https://gritos.com/sw.js is live right now), and it caches
 * the versioned `/dist/1.10.10/…` bundle. A service worker survives a redeploy:
 * every returning visitor would keep the old worker installed, still answering
 * from a cache full of assets the React build no longer produces.
 *
 * The React build dropped offline-plugin deliberately, so there is nothing to
 * replace it with — but the path cannot simply 404 either, since an existing
 * registration is only replaced when the browser fetches a *new* script here.
 * So this ships as a worker whose whole job is to uninstall itself: drop every
 * cache, unregister, and force open clients back onto the network.
 *
 * Do not delete this file until the deployed workers are gone — realistically,
 * not for a long time, since a client that never revisits never updates.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      // Reload open tabs so they stop being served by this worker.
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
