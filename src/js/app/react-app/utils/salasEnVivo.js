import { AVISOS } from "./avisosApi";

// Gritos en vivo: el servicio de la bandeja avisa por SSE de que ha llegado un mensaje a un foro, muro o foroscomun (sala publica, sin sesion).
// Una pagina escucha UNA sala (la de su foro) aunque tenga muchos hilos abiertos: las respuestas llegan a la sala del foro con el indice del hilo.
// Una conexion por sala, compartida y contada; se cierra al irse el ultimo que la escuchaba.

const conexiones = new Map(); // sala -> { fuente, oyentes: Set }

// 'collection:kingcrimson' | 'kingcrimson' | 'gritos/kingcrimson/38631' | 'ciudadanos/5726/' | 'foroscomun'  ->  { sala, hilo }
// sala = la que escuchar; hilo = el indice del hilo si es una respuesta (null si es la lista del foro). null si no se reconoce.
export const parseRoom = (room) => {
  if (typeof room !== "string") {
    return null;
  }
  const crudo = room.replace(/^collection:/, "").replace(/\/+$/, "");
  if (crudo === "gritos" || crudo === "ciudadanos") {
    return null; // son prefijos, no foros
  }
  let m = /^ciudadanos\/(\d{1,9})(?:\/(\d{1,9}))?$/.exec(crudo);
  if (m) {
    return { sala: `ciudadanos/${m[1]}`, hilo: m[2] ? crudo : null };
  }
  m = /^(?:gritos\/)?(\w{1,40})(?:\/(\d{1,9}))?$/.exec(crudo);
  if (!m) {
    return null;
  }
  const foro = m[1] === "foroscomun" ? "foroscomun" : `gritos/${m[1]}`;
  return { sala: foro, hilo: m[2] ? `${foro === "foroscomun" ? "gritos/foroscomun" : foro}/${m[2]}` : null };
};

export const escucharSala = (sala, oyente) => {
  if (typeof EventSource === "undefined") {
    return () => {};
  }
  let c = conexiones.get(sala);
  if (!c) {
    c = { oyentes: new Set(), fuente: null };
    conexiones.set(sala, c);
    const fuente = new EventSource(`${AVISOS}sala/stream?sala=${encodeURIComponent(sala)}`);
    c.fuente = fuente;
    fuente.addEventListener("sala", (e) => {
      let datos;
      try {
        datos = JSON.parse(e.data);
      } catch {
        return;
      }
      c.oyentes.forEach((o) => o(datos));
    });
    // 429 (demasiadas conexiones) y similares cierran el EventSource para siempre: sin vivo, la pagina sigue funcionando como siempre
    fuente.onerror = () => {
      if (fuente.readyState === 2) {
        conexiones.delete(sala);
      }
    };
  }
  c.oyentes.add(oyente);
  return () => {
    c.oyentes.delete(oyente);
    if (c.oyentes.size === 0) {
      c.fuente.close();
      if (conexiones.get(sala) === c) {
        conexiones.delete(sala);
      }
    }
  };
};

export const conexionesAbiertas = () => conexiones.size;
