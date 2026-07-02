import PropTypes from "prop-types";
import MiniMessageItem from "./MiniMessageItem";

/**
 * A list of MiniMessageItems.
 * Replaces src/js/app/main/foros/miniMsgCollectionView.js.
 */
const MiniMessageList = ({ messages, currentForo, isLoading }) => {
  if (isLoading) {
    return <div className="mini-messages-loading">Cargando mensajes...</div>;
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="mini-messages-empty">No hay mensajes disponibles.</div>
    );
  }

  return (
    <ul className="mini-messages-list mdl-list">
      {messages.map((msg) => (
        <MiniMessageItem key={msg.ID} message={msg} currentForo={currentForo} />
      ))}
    </ul>
  );
};

MiniMessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
  currentForo: PropTypes.string,
  isLoading: PropTypes.bool,
};

MiniMessageList.defaultProps = {
  messages: [],
  currentForo: "foroscomun",
  isLoading: false,
};

export default MiniMessageList;
