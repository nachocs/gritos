import { activarPush, autoActivar, b64uAUint8, desactivarPush, pedirYActivar, pushBaja } from "../pushAvisos";

const UID = "s".repeat(48);
const CLAVE = Buffer.from(Uint8Array.from({ length: 65 }, (_, i) => i + 1)).toString("base64url");
let llamadas, sub, registro, almacen, permiso, subActual, falloAlta;

const montarNavegador = ({ hayRegistro = true, soporta = true } = {}) => {
  llamadas = [];
  almacen = {};
  subActual = null;
  falloAlta = false;
  sub = {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc",
    toJSON: () => ({ endpoint: sub.endpoint, keys: { p256dh: "pp", auth: "aa" } }),
    unsubscribe: jest.fn(async () => { subActual = null; return true; }),
    options: { applicationServerKey: Uint8Array.from({ length: 65 }, (_, i) => i + 1).buffer },
  };
  registro = { pushManager: { getSubscription: async () => subActual, subscribe: jest.fn(async (o) => { llamadas.push(["subscribe", o.applicationServerKey.length]); subActual = sub; return sub; }) } };
  const sw = {
    getRegistration: async () => (hayRegistro || llamadas.some((l) => l[0] === "register") ? registro : undefined),
    register: jest.fn(async (u) => { llamadas.push(["register", u]); }),
    ready: Promise.resolve(registro),
  };
  if (soporta) {
    Object.defineProperty(navigator, "serviceWorker", { value: sw, configurable: true });
    window.PushManager = function PushManager() {};
  } else {
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
    delete window.PushManager;
  }
  permiso = "granted";
  window.Notification = { get permission() { return permiso; }, requestPermission: jest.fn(async () => permiso) };
  global.Notification = window.Notification;
  Object.defineProperty(window, "localStorage", { configurable: true, value: { getItem: (k) => almacen[k] ?? null, setItem: (k, v) => { almacen[k] = v; }, removeItem: (k) => { delete almacen[k]; } } });
  global.fetch = jest.fn(async (url, op) => {
    llamadas.push([op?.method || "GET", url, op?.headers?.Authorization, op?.body]);
    if (url.endsWith("push/clave")) return { status: 200, json: async () => ({ clave: CLAVE }) };
    if (url.endsWith("push/suscribir")) return { status: falloAlta ? 500 : 200, json: async () => ({ ok: !falloAlta }) };
    return { status: 200, json: async () => ({ borradas: 1 }) };
  });
};
beforeEach(() => montarNavegador());
afterEach(() => { delete global.fetch; });

describe("b64uAUint8", () => {
  it("decodifica la clave VAPID", () => {
    const b = b64uAUint8(CLAVE);
    expect(b).toHaveLength(65);
    expect(b[0]).toBe(1);
    expect(b[64]).toBe(65);
  });
});

describe("activarPush", () => {
  it("registra el service worker de gritos, se suscribe con la clave del servidor y da de alta el dispositivo con la sesion", async () => {
    montarNavegador({ hayRegistro: false });
    await activarPush(UID);
    expect(llamadas.find((l) => l[0] === "register")[1]).toBe("/sw.js");
    expect(llamadas).toContainEqual(["subscribe", 65]);
    const alta = llamadas.find((l) => l[1] === "/avisos-api/push/suscribir");
    expect(alta[2]).toBe(`Bearer ${UID}`);
    expect(JSON.parse(alta[3])).toEqual({ endpoint: sub.endpoint, keys: { p256dh: "pp", auth: "aa" } });
  });
  it("si el servidor no acepta el alta, deshace la suscripcion y falla", async () => {
    falloAlta = true;
    await expect(activarPush(UID)).rejects.toThrow("servidor");
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
  it("sin clave del servidor no se suscribe", async () => {
    global.fetch = jest.fn(async () => ({ status: 404, json: async () => ({}) }));
    await expect(activarPush(UID)).rejects.toThrow("clave");
    expect(registro.pushManager.subscribe).not.toHaveBeenCalled();
  });
});

describe("pedirYActivar (solo desde un clic)", () => {
  it("con el permiso por pedir: lo pide y activa", async () => {
    permiso = "default";
    window.Notification.requestPermission = jest.fn(async () => { permiso = "granted"; return "granted"; });
    expect(await pedirYActivar(UID)).toBe("activados");
    expect(window.Notification.requestPermission).toHaveBeenCalled();
  });
  it("si dice que no, no se suscribe y se distingue de un fallo", async () => {
    permiso = "default";
    window.Notification.requestPermission = jest.fn(async () => "denied");
    expect(await pedirYActivar(UID)).toBe("denegado");
    expect(registro.pushManager.subscribe).not.toHaveBeenCalled();
    falloAlta = true;
    permiso = "granted";
    expect(await pedirYActivar(UID)).toBe("error");
  });
});

describe("desactivarPush", () => {
  it("se da de baja en el navegador y en el servidor", async () => {
    subActual = sub;
    await desactivarPush(UID);
    expect(sub.unsubscribe).toHaveBeenCalled();
    const baja = llamadas.find((l) => l[1] === "/avisos-api/push/baja");
    expect(JSON.parse(baja[3])).toEqual({ endpoint: sub.endpoint });
  });
  it("sin suscripcion no hace nada", async () => {
    await desactivarPush(UID);
    expect(llamadas.some((l) => l[1] === "/avisos-api/push/baja")).toBe(false);
  });
});

describe("al salir de la cuenta: pushBaja", () => {
  it("con avisos activados: da de baja el dispositivo y apunta QUIEN los tenia", async () => {
    subActual = sub;
    await pushBaja(UID, "17426");
    expect(almacen.gritosPushYo).toBe("17426");
    expect(llamadas.some((l) => l[1] === "/avisos-api/push/baja" && l[2] === `Bearer ${UID}`)).toBe(true);
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
  it("sin avisos activados no apunta nada; sin sesion o sin soporte, tampoco falla", async () => {
    await pushBaja(UID, "17426");
    expect(almacen.gritosPushYo).toBeUndefined();
    await expect(pushBaja("", "1")).resolves.toBeUndefined();
    montarNavegador({ soporta: false });
    await expect(pushBaja(UID, "1")).resolves.toBeUndefined();
  });
  it("aunque el servidor no conteste, el dispositivo queda dado de baja en el navegador", async () => {
    subActual = sub;
    global.fetch = jest.fn(async () => { throw new Error("red"); });
    await pushBaja(UID, "17426");
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
});

describe("al entrar: autoActivar", () => {
  it("la misma cuenta, permiso concedido, sin suscripcion: se reactivan solos y se quita la marca", async () => {
    almacen.gritosPushYo = "17426";
    expect(await autoActivar(UID, "17426")).toBe(true);
    expect(registro.pushManager.subscribe).toHaveBeenCalled();
    expect(almacen.gritosPushYo).toBeUndefined();
  });
  it("otra cuenta NO los hereda (y la marca se queda para quien la puso)", async () => {
    almacen.gritosPushYo = "17426";
    expect(await autoActivar(UID, "99")).toBe(false);
    expect(registro.pushManager.subscribe).not.toHaveBeenCalled();
    expect(almacen.gritosPushYo).toBe("17426");
  });
  it("sin marca, sin permiso concedido o sin soporte: no hace nada", async () => {
    expect(await autoActivar(UID, "17426")).toBe(false);
    almacen.gritosPushYo = "17426";
    permiso = "default";
    expect(await autoActivar(UID, "17426")).toBe(false);
    permiso = "denied";
    expect(await autoActivar(UID, "17426")).toBe(false);
    montarNavegador({ soporta: false });
    almacen.gritosPushYo = "17426";
    expect(await autoActivar(UID, "17426")).toBe(false);
    expect(registro.pushManager.subscribe).not.toHaveBeenCalled();
  });
  it("si ya hay suscripcion no vuelve a suscribir, pero quita la marca", async () => {
    almacen.gritosPushYo = "17426";
    subActual = sub;
    expect(await autoActivar(UID, "17426")).toBe(true);
    expect(registro.pushManager.subscribe).not.toHaveBeenCalled();
    expect(almacen.gritosPushYo).toBeUndefined();
  });
  it("si falla, la marca se queda para reintentarlo la proxima vez", async () => {
    almacen.gritosPushYo = "17426";
    falloAlta = true;
    expect(await autoActivar(UID, "17426")).toBe(false);
    expect(almacen.gritosPushYo).toBe("17426");
  });
});
