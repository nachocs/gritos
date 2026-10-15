// Cliente de la bandeja de notificaciones (repo dreamers-notificaciones): el MISMO servicio que usa dreamers.es. gritos.com lo ve por su
// propio proxy (/avisos-api/), asi la galleta `city` es del propio origen y el servicio puede leerla (EventSource no manda cabeceras).
// Las cuentas son comunes: la bandeja es una sola, con avisos de los dos sitios.
export const AVISOS = "/avisos-api/";
export const DREAMERS = "https://dreamers.es";
export const URL_AJUSTES = `${DREAMERS}/ciudad/mi/avisos`;
export const URL_TODAS = `${DREAMERS}/ciudad/mi/notificaciones`;

// { estado, datos } sin lanzar por un 4xx (el llamador decide); lanza solo si no hay red.
export const avisosFetch = async (ruta, { uid, metodo = "GET", cuerpo, signal } = {}) => {
  const cabeceras = { Accept: "application/json" };
  if (uid) {
    cabeceras.Authorization = `Bearer ${uid}`;
  }
  if (cuerpo) {
    cabeceras["Content-Type"] = "application/json";
  }
  const respuesta = await fetch(`${AVISOS}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    credentials: "same-origin",
    keepalive: Boolean(cuerpo),
    signal,
  });
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  return { estado: respuesta.status, datos };
};

// A donde lleva un aviso: los de gritos.com son rutas de esta app (se navega sin recargar); los de dreamers.es llegan como ruta
// ("/articulos/970#g5") y se abren en dreamers.es. Cualquier otra cosa se descarta (nunca un javascript: ni otro dominio).
export const destinoDeAviso = (url) => {
  if (typeof url !== "string") {
    return null;
  }
  if (/^https:\/\/gritos\.com(\/|$)/.test(url)) {
    return { interno: true, ruta: url.replace(/^https:\/\/gritos\.com/, "") || "/" };
  }
  if (/^\/(?!\/)/.test(url)) {
    return { interno: false, ruta: `${DREAMERS}${url}` };
  }
  return null;
};

// La clave de seguir de un foro: foroscomun, gritos/<foro>, o el muro ciudadanos/<id>. Es la misma que usa el servidor (indice del motor).
export const claveForo = ({ foro, id }) => {
  if (!foro && id) {
    return /^[1-9]\d{0,8}$/.test(String(id)) ? `ciudadanos/${id}` : null;
  }
  const nombre = foro || "foroscomun";
  if (nombre === "foroscomun") {
    return "foroscomun";
  }
  return /^\w{1,40}$/.test(nombre) ? `gritos/${nombre}` : null;
};
