import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultDreamy from "../../../../img/dreamy4.gif";
import useJsonSearch from "../hooks/useJsonSearch";

/**
 * Floating "who did this" panel. Port of legacy mainView.openUserList +
 * userListView: hovering any element that carries `data-userlist` (the mola/
 * love/nomola logs on message cards and the vote logs on encuesta options)
 * fetches those users (`indice=ciudadanos&encontrar=listar:<log>`) and floats a
 * panel above the icon. Clicking a user goes to their wall.
 *
 * A single delegated listener handles every trigger, mirroring legacy's one
 * `mouseover [data-userlist]` binding rather than wiring hover state into each
 * card component.
 */
const UserListPopup = () => {
  const navigate = useNavigate();
  const [trigger, setTrigger] = useState(null);
  const hideTimer = useRef(null);

  const { data: users, loading } = useJsonSearch({
    foro: trigger ? "ciudadanos" : null,
    encontrar: trigger ? `listar:${trigger.userlist}` : undefined,
  });

  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => setTrigger(null), 200);
  };

  useEffect(() => {
    const onOver = (event) => {
      const el = event.target.closest?.("[data-userlist]");
      if (!el) {
        return;
      }
      const userlist = el.getAttribute("data-userlist");
      if (!userlist) {
        return;
      }
      cancelHide();
      const rect = el.getBoundingClientRect();
      setTrigger((prev) => {
        if (prev && prev.userlist === userlist) {
          return prev;
        }
        return {
          userlist,
          userlisthead: el.getAttribute("data-userlisthead") || "",
          top: rect.top,
          left: rect.left,
        };
      });
    };
    const onOut = (event) => {
      const el = event.target.closest?.("[data-userlist]");
      if (!el) {
        return;
      }
      // Still inside the same trigger (moved onto a child) — keep it open.
      if (event.relatedTarget && el.contains(event.relatedTarget)) {
        return;
      }
      scheduleHide();
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelHide();
    };
  }, []);

  if (!trigger) {
    return null;
  }

  return (
    <div
      className="user-list"
      style={{
        position: "fixed",
        top: trigger.top,
        left: trigger.left,
        transform: "translateY(calc(-100% - 10px))",
      }}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
    >
      {trigger.userlisthead && (
        <div className="user-list-head">
          <span>{trigger.userlisthead}</span>
        </div>
      )}
      {loading && <span>Cargando...</span>}
      <ul className="user-list-content">
        {users.map((u) => (
          <li
            key={u.ID}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/ciudadanos/${u.ID}`)}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/ciudadanos/${u.ID}`)}
          >
            <div
              className="minidreamy"
              style={{
                backgroundImage: `url('${
                  u.dreamy_principal || u.FB_picture || defaultDreamy
                }')`,
              }}
            />
            <span>{u.alias_principal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserListPopup;
