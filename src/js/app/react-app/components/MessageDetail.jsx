import PropTypes from "prop-types";
import MessageItem from "./MessageItem";

/**
 * Detailed view for a single message thread.
 * Migrated from the messageView logic.
 */
const MessageDetail = ({ message, currentForo }) => {
  // In the detail view, we show the full message card.
  // showForm is set to false here because we usually show a persistent reply form
  // below the thread rather than a link to the thread itself.
  return (
    <section className="message-detail">
      <MessageItem
        message={message}
        currentForo={currentForo}
        showForm={false}
      />

      <div className="message-replies">
        {/* This is where the replies collection would be mapped in future steps */}
      </div>
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
};

export default MessageDetail;
