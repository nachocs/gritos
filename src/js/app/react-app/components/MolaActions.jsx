import PropTypes from "prop-types";
import { useState } from "react";
import Ws from "../../util/Ws";
import { useUser } from "../hooks/useContexts";
import { fetchMessage, saveMessage } from "../utils/foroApi";

const TYPES = [
  {
    key: "love",
    activeIcon: "fa-heart faa-slow",
    idleIcon: "fa-heart-o",
    animation: "faa-pulses faa-fast",
    activeTitle: "te encanta ésto",
    idleTitle: "¿te encanta?",
    userListHead: () => "love",
  },
  {
    key: "mola",
    activeIcon: "fa-thumbs-up faa-slow",
    idleIcon: "fa-thumbs-o-up",
    animation: "faa-bounce",
    activeTitle: "te mola ésto",
    idleTitle: "¿a que mola?",
    userListHead: (count) => `le${count > 1 ? "s" : ""} mola`,
  },
  {
    key: "nomola",
    activeIcon: "fa-thumbs-down faa-slow",
    idleIcon: "fa-thumbs-o-down",
    animation: "faa-bounce",
    activeTitle: "ésto no te mola",
    idleTitle: "¿ésto no mola para nada?",
    userListHead: (count) => `no le${count > 1 ? "s" : ""} mola`,
  },
];

const logToArray = (log) => (log ? log.split("|").filter(Boolean) : []);

/**
 * mola / nomola / love actions on a message card.
 * Port of legacy main/message/molaView.js: each vote type keeps a
 * pipe-separated user-ID log (`molalog` etc.); clicking re-fetches the
 * fresh entity, toggles the current user's ID in that log, saves the full
 * model back, and notifies the room over the socket.
 */
const MolaActions = ({ message, onMessageChange }) => {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);

  // Legacy renders nothing for logged-out visitors.
  if (!user?.ID) {
    return null;
  }

  const toggle = async (tipo) => {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      const fresh = await fetchMessage({
        foro: message.INDICE,
        id: message.ID,
      });
      const log = logToArray(fresh[`${tipo}log`]);
      const wasSet = log.includes(user.ID);
      const newLog = wasSet
        ? log.filter((id) => id !== user.ID)
        : [...log, user.ID];
      const updated = {
        ...fresh,
        [`${tipo}log`]: newLog.join("|"),
        [tipo]: newLog.length,
      };
      const saved = await saveMessage({ message: updated });
      // Legacy msgModel's sync handler broadcasts the vote to the room.
      Ws.update(`${message.INDICE}/${message.ID}`, tipo, user.ID);
      onMessageChange(saved && saved.ID ? saved : updated);
    } catch (err) {
      console.error("mola action failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mola-view">
      {TYPES.map(({ key, activeIcon, idleIcon, animation, activeTitle, idleTitle, userListHead }) => {
        const count = Number(message[key]) || 0;
        const active = logToArray(message[`${key}log`]).includes(user.ID);
        return (
          <span
            key={key}
            className={`action ${key} mdl-badge mdl-badge--no-background mdl-badge--overlap faa-parent animated-hover ${active ? "active" : ""}`}
            {...(count > 0 ? { "data-badge": count } : {})}
            onClick={() => toggle(key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggle(key)}
          >
            <i
              data-userlist={message[`${key}log`] || ""}
              data-userlisthead={userListHead(count)}
              className={`fa ${active ? activeIcon : idleIcon} ${animation}`}
              aria-hidden="true"
              title={active ? activeTitle : idleTitle}
            />
          </span>
        );
      })}
    </div>
  );
};

MolaActions.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    INDICE: PropTypes.string.isRequired,
  }).isRequired,
  onMessageChange: PropTypes.func.isRequired,
};

export default MolaActions;
