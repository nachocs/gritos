import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import {
  desactivarPush,
  esIOS,
  instalada,
  pedirYActivar,
  pushSoportado,
  resincronizar,
  suscripcionActual,
} from "../utils/pushAvisos";

// "Avisos en este dispositivo": un aviso del navegador o del movil aunque gritos.com este cerrado. El permiso solo se pide al pulsar «Activar».
const AvisosDispositivo = ({ uid }) => {
  const [estado, setEstado] = useState("cargando"); // cargando | activados | apagados | denegado | ios | nada
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const mirar = useCallback(async () => {
    if (!pushSoportado()) {
      setEstado(esIOS() && !instalada() ? "ios" : "nada");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("denegado");
      return;
    }
    try {
      const sub = await suscripcionActual();
      if (sub && Notification.permission === "granted") {
        setEstado("activados");
        resincronizar(uid, sub).catch(() => {});
      } else {
        setEstado("apagados");
      }
    } catch {
      setEstado("nada");
    }
  }, [uid]);

  useEffect(() => {
    mirar();
  }, [mirar]);

  const activar = async () => {
    setOcupado(true);
    setMensaje("");
    const r = await pedirYActivar(uid);
    setOcupado(false);
    if (r === "activados") {
      setEstado("activados");
      setMensaje("Avisos activados en este dispositivo");
    } else if (r === "denegado") {
      setEstado("denegado");
    } else {
      setMensaje("No se han podido activar los avisos. Prueba de nuevo más tarde.");
    }
  };
  const desactivar = async () => {
    setOcupado(true);
    try {
      await desactivarPush(uid);
      setEstado("apagados");
      setMensaje("Avisos desactivados en este dispositivo");
    } catch {
      setMensaje("No se han podido desactivar. Prueba de nuevo.");
    }
    setOcupado(false);
  };

  if (estado === "cargando" || estado === "nada") {
    return null;
  }
  return (
    <div className="avisos-dispositivo">
      {estado === "ios" && (
        <p>Para recibir avisos en el iPhone, añade gritos a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y actívalos desde allí.</p>
      )}
      {estado === "denegado" && <p>Has bloqueado las notificaciones de gritos en este navegador. Puedes cambiarlo en los ajustes del sitio.</p>}
      {estado === "apagados" && (
        <>
          <p>Recibe un aviso en este dispositivo aunque gritos esté cerrado.</p>
          <button type="button" className="mdl-button mdl-js-button mdl-button--colored" onClick={activar} disabled={ocupado}>
            Activar avisos
          </button>
        </>
      )}
      {estado === "activados" && (
        <>
          <p>Avisos activados en este dispositivo.</p>
          <button type="button" className="mdl-button mdl-js-button" onClick={desactivar} disabled={ocupado}>
            Desactivar
          </button>
        </>
      )}
      <span className="avisos-dispositivo-msg" role="status" aria-live="polite">
        {mensaje}
      </span>
    </div>
  );
};

AvisosDispositivo.propTypes = { uid: PropTypes.string };

export default AvisosDispositivo;
