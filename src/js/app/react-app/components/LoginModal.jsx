import Cookies from "js-cookie";
import { useState } from "react";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import mockup from "../../util/mockups";
import { useUser } from "../hooks/useContexts";
import { closeModal } from "../utils/modalEvents";

const LoginModal = () => {
  const { login } = useUser();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const loginCall = async (data) => {
    if (mockup.active) {
      login(mockup.loginMockup.user.uid);
      closeModal();
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
      const jsonResponse = JSON.parse(await decodeBody(response));

      if (jsonResponse.status !== "ok") {
        setError("Error de autenticación.");
        Cookies.remove("city");
      } else {
        login(jsonResponse.uid);
        Cookies.set("city", JSON.stringify({ uid: jsonResponse.uid }));
        closeModal();
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

  return (
    <div className="login-modal">
      <form onSubmit={handleLogin}>
        <div className="modal-group">
          <label htmlFor="loginAlias">Alias/email</label>
          <input
            id="loginAlias"
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            disabled={loggingIn}
          />
        </div>
        <div className="modal-group">
          <label htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loggingIn}
          />
        </div>
        {error && <div className="modal-error">{error}</div>}
        <button
          type="submit"
          className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
          disabled={loggingIn}
        >
          {loggingIn ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <div className="fb-login" onClick={handleFbLogin}>
        <i className="fa fa-facebook-official fa-2x" aria-hidden="true" />
        <span>Facebook Log In/Sign Up</span>
      </div>
    </div>
  );
};

export default LoginModal;
