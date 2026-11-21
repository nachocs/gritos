import { createContext, useCallback, useState } from "react";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import mockup from "../../util/mockups";

// Since 2026-11-21 registro.cgi does NOT create the account: it stores a pending
// sign-up and emails a confirmation link (admin/altas.pl on the server, shared
// with dreamers.es/ciudad/registro/). The account only exists once the link is
// pressed, so a successful answer is {status: "pendiente", email} and there is
// nothing to log in with yet. Errors come back as codes; the texts live here.
export const REGISTRATION_ERRORS = {
  alias_corto: "Alias mu corto",
  alias_largo: "Alias demasiado largo (25 caracteres como mucho)",
  alias_raro: "Ese alias lleva algún carácter que no vale",
  alias_cogido: "El alias ya está pillao",
  email_malo: "email no vale",
  clave_corta: "password de 8 characteres al menos, porfa",
  clave_larga: "password demasiado larga",
  verificacion:
    "No hemos podido comprobar que no eres un robot. Espera un segundo y vuelve a probar.",
  verificacion_caida:
    "Ahora mismo no podemos comprobar que no eres un robot. Prueba dentro de un rato.",
  limite: "Demasiadas altas en poco rato. Prueba dentro de un rato.",
  fallo: "No hemos podido mandarte el correo. Prueba dentro de un rato.",
  cerrado: "El registro está cerrado ahora mismo.",
};

export const registrationErrorText = (code) =>
  REGISTRATION_ERRORS[code] || code || "Error al registrarse.";

export const RegistrationContext = createContext({
  registering: false,
  error: null,
  register: () => {},
  clearError: () => {},
});

export const RegistrationProvider = ({ children }) => {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);

  const register = useCallback((alias, email, password, turnstile) => {
    return new Promise((resolve, reject) => {
      setRegistering(true);
      setError(null);

      // Handle mockup mode
      if (mockup.active) {
        setTimeout(() => {
          setRegistering(false);
          resolve({ status: "pendiente", email });
        }, 500);
        return;
      }

      const formData = new FormData();
      formData.append("alias", alias);
      formData.append("email", email);
      formData.append("password", password);
      if (turnstile) formData.append("turnstile", turnstile);

      fetch(`${endpoints.apiUrl}registro.cgi`, {
        method: "POST",
        body: formData,
      })
        .then((response) => decodeBody(response).then(JSON.parse))
        .then((data) => {
          setRegistering(false);

          if (data.status !== "pendiente") {
            const errorMsg = registrationErrorText(data.error || data.status);
            setError(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          resolve(data);
        })
        .catch((err) => {
          setRegistering(false);
          const errorMsg =
            err.message || "Error de servidor. Intenta de nuevo.";
          setError(errorMsg);
          reject(err);
        });
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    registering,
    error,
    register,
    clearError,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};
