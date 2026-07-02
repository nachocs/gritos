import { createContext, useCallback, useEffect, useState } from "react";
import endpoints from "../../util/endpoints";
import { useUser } from "../hooks/useContexts";

export const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: true,
  addNotification: () => {},
  markNotificationAsRead: () => {},
  clearNotifications: () => {},
});

export const NotificationsProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateQueue, setUpdateQueue] = useState([]);

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user?.ID) {
      setLoading(true);
      fetch(`${endpoints.apiUrl}index.cgi?notificaciones/${user.ID}`)
        .then((response) => response.json())
        .then((data) => {
          setNotifications(data || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading notifications:", err);
          setLoading(false);
        });
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user?.ID]);

  const addNotification = useCallback((tipo, room, last, subtipo) => {
    setUpdateQueue((prev) => [...prev, { tipo, room, last, subtipo }]);
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
  }, []);

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
