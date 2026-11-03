import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import MessageItem from "./MessageItem";

/**
 * Detailed view for a single message thread.
 * Legacy rendered the same full msgView here as in the foro list — card,
 * comment thread (always loaded on the detail page) and reply form.
 */
// Quien llega a un grito suelto (desde un aviso o un enlace compartido) no tenia
// por donde volver al foro: la miga de arriba se lo da. Misma ruta que el titulo
// de la cabecera: "/" en foroscomun.
const MessageDetail = ({ message, currentForo, head = null }) => (
  <section className="message-detail">
    <nav className="volver-foro" aria-label="Volver al foro">
      <Link to={currentForo === "foroscomun" ? "/" : `/${currentForo}`}>
        ← {head?.Titulo || currentForo}
      </Link>
    </nav>
    <MessageItem
      message={message}
      currentForo={currentForo}
      head={head}
      forceThread
    />
  </section>
);

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
