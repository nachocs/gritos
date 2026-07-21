import Cookies from "js-cookie";
import { createContext, useCallback, useState } from "react";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import mockup from "../../util/mockups";

export const RegistrationContext = createContext({
  registering: false,
  error: null,
  register: () => {},
  clearError: () => {},
});

export const RegistrationProvider = ({ children }) => {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);

  const register = useCallback((alias, email, password) => {
    return new Promise((resolve, reject) => {
      setRegistering(true);
      setError(null);

      // Handle mockup mode
      if (mockup.active) {
        setTimeout(() => {
          setRegistering(false);
          resolve({
            status: "ok",
            user: mockup.loginMockup.user,
            uid: mockup.loginMockup.uid,
          });
        }, 500);
        return;
      }

      const formData = new FormData();
      formData.append("alias", alias);
      formData.append("email", email);
      formData.append("password", password);

      fetch(`${endpoints.apiUrl}registro.cgi`, {
        method: "POST",
        body: formData,
      })
        .then((response) => decodeBody(response).then(JSON.parse))
        .then((data) => {
          setRegistering(false);

          if (data.status !== "ok") {
            const errorMsg =
              data.status || data.error || "Error al registrarse.";
            setError(errorMsg);
            Cookies.remove("city");
            reject(new Error(errorMsg));
            return;
          }

          Cookies.set("city", JSON.stringify({ uid: data.uid }));
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
