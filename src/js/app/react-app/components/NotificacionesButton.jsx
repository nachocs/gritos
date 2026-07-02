import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationsContext } from "../contexts/NotificationsContext";
import { useUser } from "../hooks/useContexts";
import NotificacionesList from "./NotificacionesList";

const classNameForCount = (count) =>
  count > 0
    ? "notificaciones-button__count is-active"
    : "notificaciones-button__count";

const buildRoute = (indice = "") => {
  let route = indice.replace(/^gritos\//, "").replace(/^foros\//, "");
  route = route.replace(/\/(\d+)\/(\d+)$/, "/$1");
  if (!route.startsWith("/")) {
    route = "/" + route;
  }
  return route;
};

const NotificacionesButton = () => {
  const { user } = useUser();
  const { notifications, unreadCount, markNotificationAsRead } =
    useContext(NotificationsContext);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const markRead = () => {
    notifications.forEach((notif) => {
      if (!notif.read) {
        markNotificationAsRead(notif.id);
      }
    });
  };

  const togglePanel = () => {
    if (!open) {
      markRead();
    }
    setOpen(!open);
  };

  const handleItemClick = (item) => {
    const route = buildRoute(item.indice);
    setOpen(false);
    navigate(route);
  };

  if (!user?.ID) {
    return null;
  }

  return (
    <div className="notificaciones-menu" ref={containerRef}>
      <button
        type="button"
        className="mdl-navigation__link notificaciones-button"
        onClick={togglePanel}
      >
        Notificaciones{" "}
        {unreadCount > 0 && (
          <span className={classNameForCount(unreadCount)}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="notificaciones-panel mdl-shadow--4dp">
          <NotificacionesList
            items={notifications}
            onItemClick={handleItemClick}
          />
        </div>
      )}
    </div>
  );
};

export default NotificacionesButton;
