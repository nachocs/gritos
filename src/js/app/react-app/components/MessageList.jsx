import PropTypes from "prop-types";
import MessageItem from "./MessageItem";

const MessageList = ({ messages, currentForo }) => {
  if (!messages || messages.length === 0) {
    return <p>No hay mensajes disponibles para este foro.</p>;
  }

  return (
    <div className="msg-list">
      {messages.map((message) => (
        <MessageItem
          key={
            message.ID ||
            message.wId ||
            `${message.INDICE || currentForo}-${message.ID || message.wId}`
          }
          message={message}
          currentForo={currentForo}
        />
      ))}
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.any),
  currentForo: PropTypes.string,
};

export default MessageList;
