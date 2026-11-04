import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { mesYAnioUnix } from "../utils/tiempo";
import MessageItem from "./MessageItem";

const UN_ANIO = 365 * 24 * 3600;

/**
 * Detailed view for a single message thread.
 * Legacy rendered the same full msgView here as in the foro list — card,
 * comment thread (always loaded on the detail page) and reply form.
 */
// Quien llega a un grito suelto (desde un aviso o un enlace compartido) no tenia
// por donde volver al foro: la miga de arriba se lo da. Misma ruta que el titulo
// de la cabecera: "/" en foroscomun.
const MessageDetail = ({ message, currentForo, head = null }) => {
  // si el grito tiene mas de un año: invitar a retomar la conversacion
  const fecha = Number(message.FECHA) || 0;
  const antiguo =
    fecha > 0 && Date.now() / 1000 - fecha > UN_ANIO
      ? mesYAnioUnix(fecha)
      : null;
  return (
    <section className="message-detail">
      <nav className="volver-foro" aria-label="Volver al foro">
        <Link to={currentForo === "foroscomun" ? "/" : `/${currentForo}`}>
          ← {head?.Titulo || currentForo}
        </Link>
      </nav>
      {antiguo && (
        <p className="hilo-antiguo">
          Esta conversación empezó en {antiguo}. ¿La retomamos? Responde abajo.
        </p>
      )}
      <MessageItem
        message={message}
        currentForo={currentForo}
        head={head}
        forceThread
      />
    </section>
  );
};

MessageDetail.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    Titulo: PropTypes.string,
    alias_principal: PropTypes.string,
  }).isRequired,
  currentForo: PropTypes.string.isRequired,
  head: PropTypes.object,
};

export default MessageDetail;
