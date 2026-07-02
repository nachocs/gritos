import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import endpoints from "../../util/endpoints";
import mockup from "../../util/mockups";
import { useUser } from "../hooks/useContexts";
import { openModal } from "../utils/modalEvents";

const LoginStatus = () => {
  const { user, login, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
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

  const loginCall = async (data) => {
    if (mockup.active) {
      login(mockup.loginMockup.user.uid);
      setMenuOpen(false);
      return;
    }

    try {
      const response = await fetch(`${endpoints.apiUrl}login.cgi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(data).toString(),
      });
      const jsonResponse = await response.json();

      if (jsonResponse.status !== "ok") {
        setError("Error de autenticación.");
        Cookies.remove("city");
      } else {
        login(jsonResponse.uid);
        Cookies.set("city", JSON.stringify({ uid: jsonResponse.uid }));
        setMenuOpen(false);
        setError("");
        setAlias("");
        setPassword("");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (!alias.trim() || !password.trim()) {
      setError("Alias y contraseña son obligatorios.");
      return;
    }

    setLoggingIn(true);
    loginCall({ alias: alias.trim(), password: password.trim() });
  };

  const handleLogout = () => {
    Cookies.remove("city");
    logout();
    if (window.FB && window.FB.logout) {
      window.FB.logout();
    }
    setMenuOpen(false);
  };

  const handleFbLogin = () => {
    if (window.FB && window.FB.login) {
      window.FB.login(
        (response) => {
          console.log("fb login response", response);
        },
        { scope: "public_profile,email" },
      );
    }
  };

  const openMenu = () => {
    setMenuOpen((current) => !current);
    setError("");
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
    user?.dreamy_principal ||
    user?.FB_picture ||
    "https://via.placeholder.com/40";

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

      {menuOpen && (
        <div
          className={`login-menu ${user?.alias_principal ? "logged-in" : "logged-out"}`}
        >
          {user?.alias_principal ? (
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
                  <img
                    src="https://via.placeholder.com/24"
                    alt="Dreamys"
                    style={{ height: 24 }}
                  />
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
          ) : (
            <form id="login-form" onSubmit={handleLogin}>
              <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                <input
                  className="mdl-textfield__input"
                  type="text"
                  id="loginAlias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  disabled={loggingIn}
                />
                <label className="mdl-textfield__label" htmlFor="loginAlias">
                  Alias/email
                </label>
              </div>
              <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                <input
                  className="mdl-textfield__input"
                  type="password"
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loggingIn}
                />
                <label className="mdl-textfield__label" htmlFor="loginPassword">
                  Password
                </label>
              </div>
              <button
                className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
                id="loginSubmit"
                type="submit"
                disabled={loggingIn}
              >
                {loggingIn ? "Entrando..." : "entrar"}
              </button>
            </form>
          )}

          {error && <div className="error-login">{error}</div>}

          {!user?.alias_principal && (
            <>
              <div className="sign-up">
                <button
                  type="button"
                  className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
                  onClick={openSignUp}
                >
                  <i className="fa fa-sign-in fa-lg" aria-hidden="true" />
                  <span>Regístrate / Sign Up</span>
                </button>
              </div>
              <div className="fb-login" onClick={handleFbLogin}>
                <i
                  className="fa fa-facebook-official fa-2x"
                  aria-hidden="true"
                />
                <span>Facebook Log In/Sign Up</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LoginStatus;
