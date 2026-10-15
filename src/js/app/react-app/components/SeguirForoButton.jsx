import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useUser } from "../hooks/useContexts";
import { avisosFetch } from "../utils/avisosApi";

// "Seguir este foro": avisos en la campana (y en el dispositivo, desde dreamers.es) de cada grito nuevo. Es la clase `foro` de la bandeja
// de notificaciones; la clave es el indice del motor (foroscomun, gritos/<foro>, ciudadanos/<id>). Solo con sesion.
const SeguirForoButton = ({ clave, titulo, esMuro }) => {
  const { user } = useUser();
  const uid = user?.uid;
  const [siguiendo, setSiguiendo] = useState(null); // null = aun no se sabe
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!uid || !clave) {
      setSiguiendo(null);
      return undefined;
    }
    let vivo = true;
    setMensaje("");
    avisosFetch("seguir", { uid })
      .then((r) => {
        if (vivo && r.estado === 200) {
          setSiguiendo((r.datos.foros || []).some((f) => f.clave === clave));
        }
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [uid, clave]);

  if (!uid || !clave || siguiendo === null) {
    return null;
  }
  // nadie sigue su propio muro: ya le llega todo lo que escriben en el
  if (esMuro && clave === `ciudadanos/${user.ID}`) {
    return null;
  }

  const alternar = async () => {
    setOcupado(true);
    try {
      const r = await avisosFetch(siguiendo ? "dejar" : "seguir", {
        uid,
        metodo: "POST",
        cuerpo: { clase: "foro", clave, etiqueta: titulo || "" },
      });
      if (r.estado === 200) {
        setSiguiendo(!siguiendo);
        setMensaje(siguiendo ? "Has dejado de seguirlo" : "Te avisaremos de los gritos nuevos");
      } else if (r.estado === 409) {
        setMensaje("Sigues ya a demasiadas cosas: deja alguna antes de seguir otra.");
      } else {
        setMensaje("No se ha podido guardar. Prueba de nuevo.");
      }
    } catch {
      setMensaje("No hay conexión con el servidor.");
    } finally {
      setOcupado(false);
    }
  };

  const que = esMuro ? "este muro" : "este foro";
  return (
    <div className="seguir-foro">
      <button
        type="button"
        className={`mdl-button mdl-js-button${siguiendo ? " mdl-button--colored seguir-foro-on" : ""}`}
        onClick={alternar}
        disabled={ocupado}
        aria-pressed={siguiendo}
        title={siguiendo ? "Dejar de recibir avisos de los gritos nuevos" : "Te avisamos cuando alguien grite aquí"}
      >
        {siguiendo ? "Siguiendo ✓" : `Seguir ${que}`}
      </button>
      <span className="seguir-foro-msg" role="status" aria-live="polite">
        {mensaje}
      </span>
    </div>
  );
};

SeguirForoButton.propTypes = {
  clave: PropTypes.string,
  titulo: PropTypes.string,
  esMuro: PropTypes.bool,
};

export default SeguirForoButton;
