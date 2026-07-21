import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationsContext } from "../contexts/NotificationsContext";
import { useUser } from "../hooks/useContexts";
import NotificacionesList from "./NotificacionesList";

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
        markNotificationAsRead(notif);
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

  // Legacy notificacionesView-t.html renders the trigger as the 36px `public`
  // material glyph carrying an MDL badge for the unread count — not a text
  // label. Rendering the word "Notificaciones" was both wrong visually and
  // wide enough to squeeze the foro title out of the mobile header. `.notis-icon`
  // is styled opacity .5, going to 1 + pointer once `active`.
  return (
    <div
      className="mdl-navigation__link notificaciones-view"
      ref={containerRef}
    >
      <div
        className="material-icons mdl-badge mdl-badge--overlap notis-icon active"
        style={{ fontSize: "36px" }}
        role="button"
        tabIndex={0}
        title="Notificaciones"
        {...(unreadCount ? { "data-badge": unreadCount } : {})}
        onClick={togglePanel}
        onKeyDown={(e) => e.key === "Enter" && togglePanel()}
      >
        public
      </div>
      <div
        className={`notificaciones-collection-view${open ? " active" : ""}`}
      >
        <NotificacionesList
          items={notifications}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
};

export default NotificacionesButton;
