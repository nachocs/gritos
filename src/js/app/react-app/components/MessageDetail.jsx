import PropTypes from "prop-types";
import MessageItem from "./MessageItem";

/**
 * Detailed view for a single message thread.
 * Legacy rendered the same full msgView here as in the foro list — card,
 * comment thread (always loaded on the detail page) and reply form.
 */
const MessageDetail = ({ message, currentForo, head }) => (
  <section className="message-detail">
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

MessageDetail.defaultProps = {
  head: null,
};

export default MessageDetail;
