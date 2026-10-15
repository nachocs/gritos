import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "../hooks/useContexts";
import { AVISOS, avisosFetch } from "../utils/avisosApi";
import notificacionesReadState from "../utils/notificacionesReadState";

export const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  addNotification: () => {},
  markNotificationAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

const LIMITE = 20;
const SONDEO_MS = 60000;
const ESCONDIDA_MS = 60000;

// Las notificaciones vienen del servicio de la bandeja (el mismo de dreamers.es), por SSE con respaldo de sondeo: ya no las empuja gritos-socket
// ni se calculan al conectar. El servidor las agrupa (una sin leer por foro y tipo): una nueva de la misma `clave` sustituye a la anterior.
export const NotificationsProvider = ({ children }) => {
  const { user } = useUser();
  const uid = user?.uid;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef(uid);
  uidRef.current = uid;

  useEffect(() => {
    if (!user?.ID || !uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return undefined;
    }

    let vivo = true;
    let fuente = null;
    let sondeo = null;
    let cierre = null;
    let ultimoId = 0;
    let contadorVisto = 0;
    setLoading(true);

    const cargar = () =>
      avisosFetch(`lista?limite=${LIMITE}`, { uid })
        .then((r) => {
          if (!vivo || r.estado !== 200) {
            return;
          }
          setNotifications(r.datos.notificaciones || []);
          contadorVisto = r.datos.sinLeer || 0;
          setUnreadCount(contadorVisto);
        })
        .catch(() => {})
        .finally(() => vivo && setLoading(false));

    const sondear = () => {
      if (sondeo) {
        return;
      }
      const tic = () =>
        avisosFetch("contador", { uid })
          .then((r) => {
            if (!vivo) {
              return;
            }
            if (r.estado === 200) {
              const hay = r.datos.sinLeer > contadorVisto;
              contadorVisto = r.datos.sinLeer;
              setUnreadCount(contadorVisto);
              if (hay) {
                cargar();
              }
            } else if (r.estado === 401) {
              clearInterval(sondeo);
            }
          })
          .catch(() => {});
      sondeo = setInterval(tic, SONDEO_MS);
    };

    const abrir = () => {
      if (fuente || !window.EventSource) {
        if (!window.EventSource) {
          sondear();
        }
        return;
      }
      fuente = new EventSource(`${AVISOS}stream${ultimoId ? `?desde=${ultimoId}` : ""}`);
      fuente.addEventListener("estado", (e) => {
        try {
          const d = JSON.parse(e.data);
          if (typeof d.sinLeer === "number") {
            setUnreadCount(d.sinLeer);
          }
        } catch {
          /* un evento mal formado no tumba nada */
        }
      });
      fuente.addEventListener("notif", (e) => {
        try {
          const nueva = JSON.parse(e.data);
          if (e.lastEventId) {
            ultimoId = Math.max(ultimoId, Number(e.lastEventId));
          }
          setNotifications((antes) => [nueva, ...antes.filter((x) => x.clave !== nueva.clave)].slice(0, LIMITE));
        } catch {
          /* idem */
        }
      });
      // 401/429 cierran el EventSource para siempre; un corte de red lo reintenta el navegador solo
      fuente.onerror = () => {
        if (fuente && fuente.readyState === 2) {
          fuente = null;
          sondear();
        }
      };
    };

    // una pestana escondida un minuto suelta la conexion (hay un maximo por usuario) y la recupera al volver
    const visibilidad = () => {
      if (document.hidden) {
        cierre = setTimeout(() => {
          if (fuente) {
            fuente.close();
            fuente = null;
          }
        }, ESCONDIDA_MS);
      } else {
        clearTimeout(cierre);
        if (!fuente && !sondeo) {
          abrir();
          cargar();
        }
      }
    };

    cargar();
    abrir();
    document.addEventListener("visibilitychange", visibilidad);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", visibilidad);
      clearTimeout(cierre);
      clearInterval(sondeo);
      if (fuente) {
        fuente.close();
      }
    };
  }, [user?.ID, uid]);

  // FormContext la llama tras publicar (marcadores de lectura del sistema antiguo, que sigue guardando la app): no afecta a la bandeja.
  const addNotification = useCallback((notis) => {
    notificacionesReadState.addNotificaciones(notis);
  }, []);

  const marcar = useCallback((cuerpo) => {
    if (!uidRef.current) {
      return Promise.resolve();
    }
    return avisosFetch("leer", { uid: uidRef.current, metodo: "POST", cuerpo })
      .then((r) => {
        if (r.estado === 200 && typeof r.datos?.sinLeer === "number") {
          setUnreadCount(r.datos.sinLeer);
        }
      })
      .catch(() => {});
  }, []);

  const markNotificationAsRead = useCallback(
    (notification) => {
      const id = typeof notification === "object" ? notification?.id : notification;
      if (!id) {
        return Promise.resolve();
      }
      setNotifications((antes) => antes.map((n) => (n.id === id ? { ...n, leida: 1 } : n)));
      return marcar({ ids: [id] });
    },
    [marcar],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((antes) => antes.map((n) => ({ ...n, leida: 1 })));
    return marcar({ todas: true });
  }, [marcar]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
