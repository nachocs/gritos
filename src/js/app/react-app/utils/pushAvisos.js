// Avisos en este dispositivo (Web Push) para gritos.com: el mismo servicio que dreamers.es, con el service worker de gritos.com (src/assets/sw.js).
// El navegador los muestra aunque la app este cerrada; hace falta el permiso de la persona, que SOLO se pide al pulsar el boton. En iPhone/iPad solo
// funcionan con la web anadida a la pantalla de inicio. Todo lo que falla devuelve false o rechaza: nunca debe romper la app.
import { avisosFetch } from "./avisosApi";

const MARCA = "gritosPushYo";

export const pushSoportado = () =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof window !== "undefined" && "PushManager" in window && "Notification" in window;
export const esIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const instalada = () =>
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

// base64url -> Uint8Array (la clave VAPID publica)
export const b64uAUint8 = (texto) => {
  const t = String(texto).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const mismaClave = (buffer, b64) => {
  if (!buffer) {
    return true;
  }
  const a = new Uint8Array(buffer);
  const b = b64uAUint8(b64);
  return a.length === b.length && a.every((v, i) => v === b[i]);
};

const conTope = (promesa, ms) =>
  Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new Error("sin service worker")), ms))]);

// registra (o recupera) el service worker de gritos y espera a que este activo
const registroSW = async () => {
  const previo = await navigator.serviceWorker.getRegistration("/");
  if (previo) {
    return previo;
  }
  await navigator.serviceWorker.register("/sw.js");
  return conTope(navigator.serviceWorker.ready, 6000);
};

export const suscripcionActual = async () => {
  if (!pushSoportado()) {
    return null;
  }
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg && reg.pushManager ? reg.pushManager.getSubscription() : null;
};

const darDeAlta = async (uid, sub) => {
  const j = sub.toJSON();
  const r = await avisosFetch("push/suscribir", { uid, metodo: "POST", cuerpo: { endpoint: j.endpoint, keys: j.keys } });
  return r.estado === 200;
};

// Da de alta ESTE dispositivo (sin interfaz): la usan el boton y la reactivacion automatica. Rechaza si algo falla; el permiso ya debe estar concedido.
export const activarPush = async (uid) => {
  const [reg, clave] = await Promise.all([registroSW(), avisosFetch("push/clave", { uid })]);
  if (clave.estado !== 200 || !clave.datos?.clave) {
    throw new Error("clave");
  }
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uAUint8(clave.datos.clave) });
  if (!(await darDeAlta(uid, sub))) {
    await sub.unsubscribe();
    throw new Error("servidor");
  }
  return sub;
};

// Pide el permiso (solo desde un clic) y activa. Devuelve 'activados' | 'denegado' | 'error'.
export const pedirYActivar = async (uid) => {
  try {
    const permiso = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permiso !== "granted") {
      return permiso === "denied" ? "denegado" : "error";
    }
    await activarPush(uid);
    return "activados";
  } catch {
    return "error";
  }
};

export const desactivarPush = async (uid) => {
  const sub = await suscripcionActual();
  if (!sub) {
    return true;
  }
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await avisosFetch("push/baja", { uid, metodo: "POST", cuerpo: { endpoint } }).catch(() => {});
  return true;
};

// Si el servidor perdio la suscripcion o cambio la clave, se arregla sola al mirar el estado
export const resincronizar = async (uid, sub) => {
  const r = await avisosFetch("push/clave", { uid });
  if (r.estado !== 200 || !r.datos?.clave) {
    return;
  }
  if (!mismaClave(sub.options && sub.options.applicationServerKey, r.datos.clave)) {
    await sub.unsubscribe();
    await activarPush(uid);
  } else {
    await darDeAlta(uid, sub);
  }
};

// Al SALIR de la cuenta: se da de baja el push de este dispositivo (la suscripcion es de la persona, no de la sesion: en un equipo compartido el siguiente
// veria los avisos del anterior) y se apunta QUIEN lo tenia, para reactivarlo solo si esa misma cuenta vuelve a entrar. Tope de 2,5 s.
export const pushBaja = (uid, userId) => {
  if (!uid || !pushSoportado()) {
    return Promise.resolve();
  }
  const trabajo = (async () => {
    const sub = await suscripcionActual();
    if (!sub) {
      return;
    }
    try {
      if (userId) {
        localStorage.setItem(MARCA, String(userId));
      }
    } catch {
      /* sin almacenamiento: no se reactivara solo */
    }
    await avisosFetch("push/baja", { uid, metodo: "POST", cuerpo: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  })().catch(() => {});
  return Promise.race([trabajo, new Promise((ok) => setTimeout(ok, 2500))]);
};

// Al entrar: si ESTA misma cuenta los tenia activados en este navegador, el permiso sigue concedido y no hay suscripcion, se reactivan solos.
export const autoActivar = async (uid, userId) => {
  let marca = "";
  try {
    marca = localStorage.getItem(MARCA) || "";
  } catch {
    /* sin almacenamiento */
  }
  if (!uid || !userId || marca !== String(userId) || !pushSoportado() || Notification.permission !== "granted") {
    return false;
  }
  const quitar = () => {
    try {
      localStorage.removeItem(MARCA);
    } catch {
      /* idem */
    }
  };
  try {
    if (!(await suscripcionActual())) {
      await activarPush(uid);
    }
    quitar();
    return true;
  } catch {
    return false;
  }
};
