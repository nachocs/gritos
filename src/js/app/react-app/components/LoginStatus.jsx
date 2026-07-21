import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import defaultDreamy from "../../../../img/dreamy4.gif";
import { useUser } from "../hooks/useContexts";
import { openModal } from "../utils/modalEvents";

const LoginStatus = () => {
  const { user, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      window.addEventListener("mousedown", handleOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    Cookies.remove("city");
    logout();
    if (window.FB && window.FB.logout) {
      window.FB.logout();
    }
    setMenuOpen(false);
  };

  const openMenu = () => {
    if (!user?.alias_principal) {
      openModal({
        model: { show: true, header: "Iniciar Sesión" },
        login: true,
      });
    } else {
      setMenuOpen((current) => !current);
    }
  };

  const openSignUp = () => {
    openModal({
      model: { show: true, header: "Regístrate" },
      signUp: true,
    });
  };

  const openDreamys = () => {
    openModal({
      model: { show: true, header: "Selecciona tu Dreamy" },
      dreamys: true,
      uploadAvailable: true,
    });
  };

  const avatarUrl =
    user?.dreamy_principal || user?.FB_picture || defaultDreamy;

  return (
    <div className="login-status" ref={menuRef}>
      <button
        type="button"
        className="mdl-navigation__link login-view login-menu-button"
        onClick={openMenu}
      >
        {user?.alias_principal ? (
          <>
            <span
              className="login-avatar"
              style={{ backgroundImage: `url(${avatarUrl})` }}
            />
            <span className="login-label">{user.alias_principal}</span>
            <i className="material-icons">keyboard_arrow_down</i>
          </>
        ) : (
          <>
            <span>Log In</span>
            <i className="material-icons">power_settings_new</i>
          </>
        )}
      </button>

      {menuOpen && user?.alias_principal && (
        <div className="login-menu logged-in">
          <ul>
            <li className="mdl-layout--small-screen-only">
              <span className="alias-principal">{user.alias_principal}</span>
            </li>
            <li>
              <button
                type="button"
                className="mdl-button mdl-js-button"
                onClick={openDreamys}
              >
                <img src={defaultDreamy} alt="Dreamys" style={{ height: 24 }} />
              </button>
              <span>Dreamys</span>
            </li>
            <li>
              <button
                type="button"
                className="js-logout mdl-button mdl-js-button"
                onClick={handleLogout}
              >
                <i className="material-icons">exit_to_app</i>
              </button>
              <span>Log Out</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoginStatus;
