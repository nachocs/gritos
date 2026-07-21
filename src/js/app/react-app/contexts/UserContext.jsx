import Cookies from "js-cookie";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import endpoints from "../../util/endpoints";
import { decodeBody, fetchJson } from "../utils/apiFetch";
import Ws from "../../util/Ws";
import { onSocketMessage } from "../utils/socketEvents";

export const UserContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  saveUser: () => {},
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // saveUser needs the current user without re-creating its callback on every
  // user change (it's passed down into the dreamys picker).
  const userRef = useRef(user);
  userRef.current = user;

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

  /**
   * Legacy `userModel.save(key, value)` — Backbone set-then-PUT. Backbone
   * serializes the *whole* model (uid included, which is how the CGI authorizes
   * the write) to `index.cgi?<INDICE>/<ID>`, the same shape `saveMessage` uses.
   *
   * `updateUser` alone only touched local state, so a chosen dreamy vanished on
   * reload (gap #29). Update optimistically like Backbone does, then persist.
   */
  const saveUser = useCallback(async (attrs) => {
    const current = userRef.current;
    if (!current?.INDICE || !current?.ID || !current?.uid) {
      throw new Error("saveUser requires a logged-in user");
    }

    const next = { ...current, ...attrs };
    setUser(next);
    try {
      await fetchJson(
        `${endpoints.apiUrl}index.cgi?${current.INDICE}/${current.ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        },
      );
    } catch (err) {
      // Roll back so the UI doesn't claim a change the server rejected.
      setUser(current);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    saveUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
