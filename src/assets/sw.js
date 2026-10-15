/*
 * Service worker de gritos.com: SOLO avisos push (la bandeja de notificaciones que comparten dreamers.es y gritos.com, servicio
 * dreamers-notificaciones). No intercepta ninguna peticion ni guarda nada: ni offline, ni cache.
 *
 * Antes este fichero era una "lapida": la build antigua (Backbone) registro aqui un service worker de offline-plugin que cacheaba
 * `/dist/1.10.10/...`, y un worker sobrevive a un despliegue, asi que habia que reemplazarlo por uno que se desinstalara. Ahora
 * quien lo reemplaza hace lo mismo con las caches viejas (las borra al activarse) pero SE QUEDA, porque lo necesita el push.
 * No hay `fetch`: las paginas siguen yendo directas a la red.
 *
 * Lo registra la app (utils/pushAvisos.js) cuando alguien activa los avisos en este dispositivo; quien no los activa nunca lo instala.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

const DREAMERS = "https://dreamers.es";
const GRITOS = "https://gritos.com";

// A donde lleva un aviso. Los de gritos.com llegan como URL absoluta (aqui se queda la ruta, para abrirla dentro de la app); los de dreamers.es
// llegan como ruta ("/articulos/970#g5") y se abren en dreamers.es. Cualquier otra cosa va a la portada de gritos.
function destinoDe(u) {
  try {
    const url = new URL(u || "/", DREAMERS);
    if (url.origin === GRITOS) {
      return { externo: false, ruta: url.pathname + url.search + url.hash };
    }
    if (url.origin === DREAMERS) {
      return { externo: true, ruta: url.href };
    }
  } catch (err) {
    /* una URL rota no es un destino */
  }
  return { externo: false, ruta: "/" };
}

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (err) {
    d = { texto: event.data ? event.data.text() : "" };
  }
  const titulo = String(d.titulo || "gritos").slice(0, 160);
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: String(d.texto || "").slice(0, 200),
      icon: "/android-icon-192x192.png",
      tag: d.tag ? String(d.tag) : undefined,
      renotify: !!d.tag,
      data: destinoDe(d.url),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { externo, ruta } = event.notification.data || { externo: false, ruta: "/" };
  if (externo) {
    event.waitUntil(self.clients.openWindow(ruta));
    return;
  }
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((ventanas) => {
        const abierta = ventanas.find((v) => v.url.indexOf(self.location.origin) === 0 && "focus" in v);
        if (!abierta) {
          return self.clients.openWindow(ruta);
        }
        return abierta.focus().then((c) => (c && "navigate" in c ? c.navigate(ruta) : self.clients.openWindow(ruta)));
      })
      .catch(() => self.clients.openWindow(ruta)),
  );
});

// Si el navegador renueva la suscripcion, se da de alta la nueva (con la sesion de la galleta `city`, del propio origen).
self.addEventListener("pushsubscriptionchange", (event) => {
  const antes = event.oldSubscription && event.oldSubscription.options;
  if (!antes || !antes.applicationServerKey) {
    return;
  }
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: antes.applicationServerKey })
      .then((sub) => {
        const j = sub.toJSON();
        return fetch("/avisos-api/push/suscribir", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
        });
      })
      .catch(() => null),
  );
});
