import Cookies from "js-cookie";
import { createContext, useCallback, useEffect, useState } from "react";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import Ws from "../../util/Ws";
import { onSocketMessage } from "../utils/socketEvents";

export const UserContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from cookies on mount
  useEffect(() => {
    const city = Cookies.get("city");
    if (city) {
      try {
        const parsedCity = JSON.parse(city);
        if (parsedCity?.uid) {
          loadUser(parsedCity.uid);
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (user?.INDICE && user?.ID) {
      const room = `msg_${user.INDICE}/${user.ID}`;
      const handleUpdate = (data) => {
        if (data.entry) {
          setUser((prev) => ({ ...prev, ...data.entry }));
          console.log("updated user", room, data.entry);
        }
      };
      const unsubscribe = onSocketMessage(`${user.INDICE}/${user.ID}`, handleUpdate);
      return () => {
        unsubscribe();
      };
    }
  }, [user?.INDICE, user?.ID]);

  // Subscribe to WebSocket when user changes
  useEffect(() => {
    if (user?.INDICE && user?.ID) {
      Ws.update(`${user.INDICE}/${user.ID}`);
    }
  }, [user?.INDICE, user?.ID]);

  const loadUser = useCallback((uid) => {
    fetch(endpoints.apiUrl + "login.cgi", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `uid=${encodeURIComponent(uid)}`,
    })
      .then((response) => decodeBody(response).then(JSON.parse))
      .then((data) => {
        if (data.status === "ok" && data.user) {
          setUser({ ...data.user, uid });
          setError(null);
        } else {
          setError(data.status || "Unknown error");
          setUser(null);
        }
      })
      .catch((err) => {
        setError(err.message);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(
    (uid) => {
      setLoading(true);
      loadUser(uid);
    },
    [loadUser],
  );

  const logout = useCallback(() => {
    Cookies.remove("city");
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  const updateUser = useCallback((attrs) => {
    setUser((prev) => ({ ...prev, ...attrs }));
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
