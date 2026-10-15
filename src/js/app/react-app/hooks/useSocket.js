import { useEffect } from "react";
import endpoints from "../../util/endpoints";
import { fetchJson } from "../utils/apiFetch";
import { escucharSala, parseRoom } from "../utils/salasEnVivo";

const pedirMensaje = (indice, id) => fetchJson(`${endpoints.apiUrl}index.cgi?${indice}/${id}`);

/**
 * Mensajes nuevos en vivo en un foro, muro o hilo (antes por gritos-socket; ahora por las salas de la bandeja de notificaciones).
 * @param {string} room - 'collection:<foro>' (la lista) o 'collection:<indice>/<id>' (las respuestas de un hilo).
 * @param {string} type - solo 'updated' (mensajes nuevos). Cualquier otro no hace nada.
 * @param {function} callback - recibe { room, entry } con el mensaje nuevo, pedido a la API (el servicio solo avisa de que existe).
 * Si el servicio no contesta (429, sin EventSource...) no pasa nada: la pagina funciona como siempre, sin el en vivo.
 */
const useSocket = (room, type, callback) => {
  useEffect(() => {
    if (!room || !callback || type !== "updated") {
      return undefined;
    }
    const destino = parseRoom(room);
    if (!destino) {
      return undefined;
    }
    let vivo = true;
    const vistos = new Set();
    const alEvento = (ev) => {
      if (!ev || !ev.indice || !ev.entrada) {
        return;
      }
      // un hilo solo quiere SUS respuestas; una lista solo quiere los gritos (las respuestas llegan a su sala pero son de los hilos)
      if (destino.hilo ? ev.tipo !== "respuesta" || ev.indice !== destino.hilo : ev.tipo !== "grito") {
        return;
      }
      const clave = `${ev.indice}/${ev.entrada}`;
      if (vistos.has(clave)) {
        return;
      }
      vistos.add(clave);
      pedirMensaje(ev.indice, ev.entrada)
        .then((entry) => {
          if (vivo && entry && entry.ID) {
            callback({ room, entry });
          }
        })
        .catch(() => {});
    };
    const dejar = escucharSala(destino.sala, alEvento);
    return () => {
      vivo = false;
      dejar();
    };
  }, [room, type, callback]);
};

export default useSocket;
