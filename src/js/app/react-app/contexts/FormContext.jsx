import { createContext, useCallback, useState } from "react";
import endpoints from "../../util/endpoints";
import Ws from "../../util/Ws";

export const FormContext = createContext({
  submitting: false,
  error: null,
  success: false,
  submitMessage: () => {},
  clearStatus: () => {},
});

export const FormProvider = ({ children }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submitMessage = useCallback((attrs) => {
    return new Promise((resolve, reject) => {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      Object.keys(attrs).forEach((key) => {
        formData.append(key, attrs[key]);
      });

      fetch(endpoints.apiUrl + "post.cgi", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "ok") {
            setSuccess(true);
            setSubmitting(false);

            // Handle WebSocket updates for notifications
            let room = null;
            if (attrs.minigrito) {
              room = `${attrs.minigrito.indice}/${attrs.minigrito.entrada}`;
            } else if (attrs.foro) {
              room = attrs.foro;
            }

            if (room && !room.match(/gritosdb/i) && room !== "ciudadanos") {
              Ws.update(`collection:${room}`);

              // Add notifications
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
              // TODO: Emit notification update event
            }

            resolve(data);
          } else {
            const err = new Error(data.status || "Error al enviar el mensaje");
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
  }, []);

  const clearStatus = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const value = {
    submitting,
    error,
    success,
    submitMessage,
    clearStatus,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
