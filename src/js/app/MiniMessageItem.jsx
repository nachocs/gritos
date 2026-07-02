import PropTypes from "prop-types";
import { Link } from "react-router-dom";

/**
 * Compact representation of a message thread.
 * Migrated from miniMsgView logic.
 */
const MiniMessageItem = ({ message, currentForo }) => {
  const { ID, INDICE, COMENTARIOS, alias_principal } = message;

  // Construct the path based on the router logic: /:foro/:id
  const messagePath = `/${currentForo}/${ID}`;

  return (
    <li className="mini-message-item mdl-list__item mdl-list__item--two-line">
      <span className="mdl-list__item-primary-content">
        <Link to={messagePath} className="mini-message-link">
          <span className="mini-message-title">{INDICE || "Sin título"}</span>
        </Link>
        <span className="mdl-list__item-sub-title">
          {alias_principal && (
            <span className="mini-message-author">{alias_principal}</span>
          )}
          {COMENTARIOS > 0 && (
            <span className="mini-message-comments">
              <i className="material-icons">comment</i> {COMENTARIOS}
            </span>
          )}
        </span>
      </span>
    </li>
  );
};

MiniMessageItem.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    INDICE: PropTypes.string,
    COMENTARIOS: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    alias_principal: PropTypes.string,
  }).isRequired,
  currentForo: PropTypes.string,
};

MiniMessageItem.defaultProps = {
  currentForo: "foroscomun",
};

export default MiniMessageItem;
