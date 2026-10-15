import fs from "fs";
import path from "path";
import vm from "vm";

// El service worker de gritos.com (src/assets/sw.js) en un `self` de mentira.
const codigo = fs.readFileSync(path.join(__dirname, "../../../../../assets/sw.js"), "utf8");

const crearSw = ({ cachesBorradas = ["offline-plugin-1", "otra"], ventanas = [] } = {}) => {
  const oyentes = {};
  const mostradas = [];
  const abiertas = [];
  const borradas = [];
  const espera = [];
  const self_ = {
    location: { origin: "https://gritos.com" },
    registration: { showNotification: (t, o) => { mostradas.push({ t, o }); return Promise.resolve(); } },
    addEventListener: (n, f) => { oyentes[n] = f; },
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn(async () => {}), matchAll: async () => ventanas, openWindow: async (u) => { abiertas.push(u); return {}; } },
  };
  const ctx = { self: self_, caches: { keys: async () => cachesBorradas, delete: async (k) => { borradas.push(k); return true; } }, URL, Promise, fetch: async () => ({}) };
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx);
  return {
    self: self_, mostradas, abiertas, borradas, oyentes,
    evento: (nombre, e) => { oyentes[nombre]({ waitUntil: (p) => espera.push(p), ...e }); },
    listo: () => Promise.all(espera),
  };
};
const push = (sw, datos) => sw.evento("push", { data: { json: () => datos } });
const clic = (sw, data) => sw.evento("notificationclick", { notification: { close() {}, data } });

describe("service worker de gritos", () => {
  it("al instalarse toma el control, y al activarse borra las caches de la version antigua SIN desregistrarse (lo necesita el push)", async () => {
    const sw = crearSw();
    sw.evento("install", {});
    expect(sw.self.skipWaiting).toHaveBeenCalled();
    sw.evento("activate", {});
    await sw.listo();
    expect(sw.borradas.sort()).toEqual(["offline-plugin-1", "otra"]);
    expect(sw.self.clients.claim).toHaveBeenCalled();
    expect(sw.self.registration.unregister).toBeUndefined();
    expect(sw.oyentes.fetch).toBeUndefined(); // no intercepta nada
  });

  it("push: muestra el aviso (titulo, texto, icono, tag) y resuelve el destino", async () => {
    const sw = crearSw();
    push(sw, { titulo: "Ana ha respondido a tu grito", texto: "Ana: cierto", url: "https://gritos.com/kingcrimson/55#g3", tag: "respuesta|x" });
    await sw.listo();
    const { t, o } = sw.mostradas[0];
    expect(t).toBe("Ana ha respondido a tu grito");
    expect(o.body).toBe("Ana: cierto");
    expect(o.icon).toBe("/android-icon-192x192.png");
    expect(o.tag).toBe("respuesta|x");
    expect(o.renotify).toBe(true);
    expect(o.data).toEqual({ externo: false, ruta: "/kingcrimson/55#g3" });
  });

  it("destinos: gritos.com se queda en la app; las rutas de dreamers.es abren dreamers.es; cualquier otra cosa, la portada", async () => {
    const sw = crearSw();
    for (const url of ["/articulos/970#g5", "https://dreamers.es/peliculas/12", "https://evil.example/x", "javascript:alert(1)", "//evil.example/x", undefined, "https://gritos.com.evil.example/x"]) {
      push(sw, { titulo: "t", url });
    }
    await sw.listo();
    expect(sw.mostradas.map((m) => m.o.data)).toEqual([
      { externo: true, ruta: "https://dreamers.es/articulos/970#g5" },
      { externo: true, ruta: "https://dreamers.es/peliculas/12" },
      { externo: false, ruta: "/" },
      { externo: false, ruta: "/" },
      { externo: false, ruta: "/" },
      { externo: true, ruta: "https://dreamers.es/" },
      { externo: false, ruta: "/" },
    ]);
  });

  it("un push sin JSON valido o sin titulo no rompe: se muestra con un titulo por defecto y el texto recortado", async () => {
    const sw = crearSw();
    sw.evento("push", { data: { json: () => { throw new Error("no json"); }, text: () => "texto suelto" } });
    sw.evento("push", { data: null });
    push(sw, { titulo: "x".repeat(500), texto: "y".repeat(500) });
    await sw.listo();
    expect(sw.mostradas[0].t).toBe("gritos");
    expect(sw.mostradas[0].o.body).toBe("texto suelto");
    expect(sw.mostradas[1].t).toBe("gritos");
    expect(sw.mostradas[2].t).toHaveLength(160);
    expect(sw.mostradas[2].o.body).toHaveLength(200);
  });

  it("pulsar un aviso: con la app abierta la enfoca y navega; sin ella la abre en la ruta; los de dreamers.es abren dreamers.es", async () => {
    const ventana = { url: "https://gritos.com/foroscomun", focus: jest.fn(async function () { return ventana; }), navigate: jest.fn(async () => ({})) };
    const a = crearSw({ ventanas: [ventana] });
    clic(a, { externo: false, ruta: "/kingcrimson/55" });
    await a.listo();
    expect(ventana.focus).toHaveBeenCalled();
    expect(ventana.navigate).toHaveBeenCalledWith("/kingcrimson/55");
    expect(a.abiertas).toEqual([]);

    const b = crearSw();
    clic(b, { externo: false, ruta: "/kingcrimson/55" });
    await b.listo();
    expect(b.abiertas).toEqual(["/kingcrimson/55"]);

    const c = crearSw({ ventanas: [ventana] });
    clic(c, { externo: true, ruta: "https://dreamers.es/articulos/970" });
    await c.listo();
    expect(c.abiertas).toEqual(["https://dreamers.es/articulos/970"]);

    const d = crearSw();
    clic(d, undefined);
    await d.listo();
    expect(d.abiertas).toEqual(["/"]);
  });
});
