import { createContext, useCallback, useContext, useState } from "react";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import Ws from "../../util/Ws";
import { NotificationsContext } from "./NotificationsContext";

export const FormContext = createContext({
  submitting: false,
  error: null,
  success: false,
  isDirty: false,
  submitMessage: () => {},
  clearStatus: () => {},
  setDirty: () => {},
});

// The gritos CGIs are not consistent about their success key: login.cgi and
// registro.cgi answer `{"status":"ok"}`, post.cgi answers `{"success":"ok"}`.
const isPostOk = (data) =>
  data?.status === "ok" || data?.success === "ok" || Boolean(data?.mensaje);

export const FormProvider = ({ children }) => {
  const { addNotification } = useContext(NotificationsContext);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Mirrors legacy Util.checkForms(), which warned on navigation whenever any
  // open composer had pending text.
  const setDirty = useCallback((dirty) => {
    setIsDirty(dirty);
  }, []);

  const submitMessage = useCallback((attrs) => {
    return new Promise((resolve, reject) => {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      // Legacy posted via Backbone.sync, which sends the model as a JSON
      // body — required for the nested `minigrito` object on replies
      // (FormData would serialize it as "[object Object]").
      fetch(endpoints.apiUrl + "post.cgi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attrs),
      })
        .then((response) => decodeBody(response).then(JSON.parse))
        .then((data) => {
          // post.cgi answers `{"success":"ok", "mensaje":{…}}` — NOT
          // `{"status":"ok"}` like login.cgi/registro.cgi do. Gating on
          // `status` therefore never passed, so *every* successful post was
          // reported to the user as "No se pudo publicar el grito", the
          // composer was never cleared and the new grito was never inserted
          // into the list — while the entry was in fact created on the server.
          // Legacy never had this bug because Backbone.sync treats any 2xx as
          // success and simply reads `data.mensaje`. Accept either key, and
          // fall back to the presence of `mensaje`, which is what the success
          // path actually consumes.
          if (isPostOk(data)) {
            setSuccess(true);
            setSubmitting(false);
            setIsDirty(false);

            // Handle WebSocket updates for notifications
            let room = null;
            if (attrs.minigrito) {
              room = `${attrs.minigrito.indice}/${attrs.minigrito.entrada}`;
            } else if (attrs.foro) {
              room = attrs.foro;
            }

            if (room && !room.match(/gritosdb/i) && room !== "ciudadanos") {
              Ws.update(`collection:${room}`);

              const notificaciones = [];
              if (attrs.minigrito) {
                notificaciones.push({
                  tipo: "minis",
                  room,
                  last: data.mensaje?.ID,
                });
                notificaciones.push({
                  tipo: "msg",
                  room: `${room}/${data.mensaje?.ID}`,
                  last: "0/0/0",
                });
              } else {
                notificaciones.push({
                  tipo: "foro",
                  room,
                  last: data.mensaje?.ID,
                });
                notificaciones.push({
                  tipo: "msg",
                  room: `${room}/${data.mensaje?.ID}`,
                  last: "0/0/0",
                });
                notificaciones.push({
                  tipo: "minis",
                  room: `${room}/${data.mensaje?.ID}`,
                  last: "0",
                });
              }
              addNotification(notificaciones);
            }

            resolve(data);
          } else {
            const err = new Error(
              data.status || data.success || "Error al enviar el mensaje",
            );
            setError(err.message);
            setSubmitting(false);
            reject(err);
          }
        })
        .catch((err) => {
          setError(err.message);
          setSubmitting(false);
          reject(err);
        });
    });
  }, [addNotification]);

  const clearStatus = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const value = {
    submitting,
    error,
    success,
    isDirty,
    submitMessage,
    clearStatus,
    setDirty,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
