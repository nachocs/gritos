import PropTypes from "prop-types";
import MessageItem from "./MessageItem";

const MessageList = ({ messages, currentForo, head }) => {
  if (!messages || messages.length === 0) {
    return <p>No hay mensajes disponibles para este foro.</p>;
  }

  return (
    <div className="msg-list">
      {messages.map((message) => (
        <MessageItem
          key={
            message.wId ||
            `${message.INDICE || currentForo}-${message.ID}`
          }
          message={message}
          currentForo={currentForo}
          head={head}
        />
      ))}
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.any),
  currentForo: PropTypes.string,
  head: PropTypes.object,
};

export default MessageList;
