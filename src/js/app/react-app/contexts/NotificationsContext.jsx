import { createContext, useCallback, useEffect, useState } from "react";
import { useUser } from "../hooks/useContexts";
import { onNotificaciones } from "../utils/socketEvents";
import Ws from "../../util/Ws";
import notificacionesReadState from "../utils/notificacionesReadState";

export const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  addNotification: () => {},
  markNotificationAsRead: () => {},
  clearNotifications: () => {},
});

let notificationSeq = 0;

export const NotificationsProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notifications are pushed over the socket, not fetched via HTTP: legacy's
  // `index.cgi?notificaciones/<ID>` is the *read-state* counter resource
  // (last-seen markers per room), not a notification feed — fetching it here
  // and treating the response as a list was wrong. The real feed comes from
  // asking the server to start pushing (Ws.prepararNotificaciones) and
  // listening for `notificaciones_<uid>` events, mirroring legacy
  // NotificacionesCollection. Read-state persistence lives in
  // utils/notificacionesReadState.js (PUT to that same resource).
  useEffect(() => {
    if (!user?.ID) {
      notificacionesReadState.clear();
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    notificacionesReadState.load(user.ID);
    Ws.prepararNotificaciones(user.ID);

    const unsubscribe = onNotificaciones(user.ID, (data) => {
      setLoading(false);
      const incoming = Array.isArray(data) ? data : [data];
      const relevant = incoming.filter(
        (not) =>
          not?.entry &&
          (not.entry.ciudadano !== user.ID ||
            (not.tipo === "msg" && not.subtipo)),
      );
      if (!relevant.length) {
        return;
      }
      setNotifications((prev) => [
        ...relevant.map((not) => ({
          ...not,
          id: not.id ?? `noti-${Date.now()}-${notificationSeq++}`,
          read: false,
        })),
        ...prev,
      ]);
    });

    return unsubscribe;
  }, [user?.ID]);

  // Called by FormContext right after a successful post, so the poster's own
  // new entry doesn't immediately show back up as unread for them.
  const addNotification = useCallback((notis) => {
    notificacionesReadState.addNotificaciones(notis);
  }, []);

  // Mirrors legacy notificacionesView.toggleNotificaciones(): only 'msg' and
  // 'yo' notifications advance the persisted read-state watermark here
  // ('foro'/'minis' are advanced elsewhere, via list-view/thread reads).
  const markNotificationAsRead = useCallback((notification) => {
    const notif =
      typeof notification === "object"
        ? notification
        : notifications.find((n) => n.id === notification);
    if (notif?.tipo === "msg" && notif.entry) {
      const foro = `${notif.indice}/${notif.entry.ID}`;
      notificacionesReadState.update(
        "msg",
        foro,
        notif.entry[notif.subtipo],
        notif.subtipo,
      );
    } else if (notif?.tipo === "yo" && notif.entry) {
      notificacionesReadState.update("yo", notif.indice, notif.entry.ID);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif?.id ? { ...n, read: true } : n)),
    );
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
