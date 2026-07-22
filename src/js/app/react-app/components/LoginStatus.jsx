import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import defaultDreamy from "../../../../img/dreamy4.gif";
import endpoints from "../../util/endpoints";
import mockup from "../../util/mockups";
import { useUser } from "../hooks/useContexts";
import { decodeBody } from "../utils/apiFetch";
import { onOpenLoginMenu } from "../utils/loginMenuEvents";
import { openModal } from "../utils/modalEvents";
import MdlTextfield from "./MdlTextfield";

// 1:1 port of legacy main/header/loginView.js + loginView-t.html. The login
// form is a dropdown panel hanging off the header button — NOT a modal. Only
// Sign Up and Dreamys open modals from here, exactly as `signUp()` and
// `dreamysModal()` do in the legacy view.
//
// `ul.login-menu` is always rendered and toggled via the `hidden` class
// (`display:none!important`, from the html5-boilerplate reset that ships inside
// material.light_green-red.min.css) rather than being conditionally mounted,
// because `.login-view ul.login-menu` in main.less is what supplies the panel's
// entire box (335px, absolute, `top:55px; right:20px`, `#fafcf6`).
const LoginStatus = () => {
  const { user, login, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loggedIn = Boolean(user?.alias_principal);

  // Legacy's mainView.newMsg() pops this same menu open when a logged-out
  // visitor taps the "+" FAB.
  useEffect(() => onOpenLoginMenu(() => setMenuOpen(true)), []);

  // Legacy re-renders the view on the user model's `change` event, which
  // rebuilds the markup with the `hidden` class back on.
  useEffect(() => {
    if (loggedIn) {
      setMenuOpen(false);
      setAlias("");
      setPassword("");
      setError("");
    }
  }, [loggedIn]);

  const toggleMenu = () => setMenuOpen((current) => !current);

  const loginCall = async (data) => {
    if (mockup.active) {
      login(mockup.loginMockup.user.uid);
      return;
    }

    try {
      const response = await fetch(`${endpoints.apiUrl}login.cgi`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      const jsonResponse = JSON.parse(await decodeBody(response));

      if (jsonResponse.status !== "ok") {
        // Legacy showError('no tira') — same copy, same `.error-login.active`.
        setError("no tira");
        Cookies.remove("city");
      } else {
        login(jsonResponse.uid);
        Cookies.set("city", JSON.stringify({ uid: jsonResponse.uid }));
      }
    } catch {
      setError("no tira");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (alias.length < 1 || password.length < 1) {
      // Legacy only console.logs here (its own TODO) and shows nothing.
      console.log("te olvidaste de poner algo");
      return;
    }
    loginCall({ alias, password });
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

  const openSignUp = () => {
    setMenuOpen(false);
    openModal({
      model: { show: true, header: "Regístrate" },
      signUp: true,
    });
  };

  const openDreamys = () => {
    setMenuOpen(false);
    openModal({
      model: { show: true, header: "Selecciona tu Dreamy" },
      dreamys: true,
      uploadAvailable: true,
    });
  };

  if (loggedIn) {
    const avatarUrl = user.dreamy_principal || user.FB_picture || defaultDreamy;

    return (
      <>
        <Link
          to={`/ciudadanos/${user.ID}`}
          className="mdl-layout--large-screen-only"
        >
          <div
            className="dreamy"
            style={{
              backgroundImage: `url('${avatarUrl}')`,
              marginRight: "8px",
            }}
          />
          <span className="mdl-layout--large-screen-only alias-principal">
            {user.alias_principal}
          </span>
        </Link>
        <button
          type="button"
          className="login-menu-button mdl-button mdl-js-button mdl-button--icon desplegable"
          onClick={toggleMenu}
        >
          <i className="material-icons">keyboard_arrow_down</i>
        </button>
        <ul
          className={`login-menu${menuOpen ? "" : " hidden"} short mdl-card mdl-shadow--4dp`}
        >
          <li className="mdl-layout--small-screen-only">
            <span className="alias-principal">{user.alias_principal}</span>
          </li>
          <li>
            <button
              type="button"
              className="js-dreamys mdl-button mdl-js-button mdl-button--icon"
              onClick={openDreamys}
            >
              <img src={defaultDreamy} alt="Dreamys" style={{ height: 24 }} />
            </button>
            <span>Dreamys</span>
          </li>
          <li>
            <button
              type="button"
              className="js-logout logout mdl-button mdl-js-button mdl-button--icon"
              onClick={handleLogout}
            >
              <i className="material-icons">exit_to_app</i>
            </button>
            <span>Log Out</span>
          </li>
        </ul>
      </>
    );
  }

  return (
    <>
      <span className="mdl-layout--large-screen-only">Log In</span>
      <button
        type="button"
        className="login-menu-button mdl-button mdl-js-button mdl-button--icon"
        onClick={toggleMenu}
      >
        <i className="material-icons">power_settings_new</i>
      </button>

      <ul
        className={`login-menu${menuOpen ? "" : " hidden"} mdl-card mdl-shadow--4dp`}
      >
        <form id="login-form" onSubmit={handleSubmit}>
          <MdlTextfield
            id="loginAlias"
            label="Alias/email"
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
          />
          <MdlTextfield
            id="loginPassword"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="submit"
            className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
            id="loginSubmit"
          >
            entrar
          </button>
        </form>
        <div className={`error-login${error ? " active" : ""}`}>{error}</div>
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
        <div
          className="fb-login"
          role="button"
          tabIndex={0}
          onClick={handleFbLogin}
          onKeyDown={(event) => event.key === "Enter" && handleFbLogin()}
        >
          <i className="fa fa-facebook-official fa-2x" aria-hidden="true" />
          <span>Facebook Log In/Sign Up</span>
        </div>
      </ul>
    </>
  );
};

export default LoginStatus;
