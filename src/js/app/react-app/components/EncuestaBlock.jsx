import PropTypes from "prop-types";
import { useState } from "react";
import { useUser } from "../hooks/useContexts";
import { fetchMessage, saveMessage } from "../utils/foroApi";

export const parseEncuesta = (raw) => {
  if (!raw) {
    return null;
  }
  try {
    const encuesta = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!encuesta?.options?.length) {
      return null;
    }
    return encuesta;
  } catch {
    return null;
  }
};

const sortedOptions = (options) =>
  [...options].sort((a, b) => (Number(b.votos) || 0) - (Number(a.votos) || 0));

const logHas = (log, userId) =>
  log ? log.split("|").some((id) => Number(id) === Number(userId)) : false;

/**
 * Poll block inside a message card.
 * Port of legacy msgView votar(): the encuesta lives as a JSON string on the
 * message; each option carries `votos` and a pipe-separated `log` of voter
 * IDs. Voting re-fetches the fresh entity, moves the user's ID between
 * option logs (one vote per user; clicking your current vote removes it),
 * and saves the whole model back.
 */
const EncuestaBlock = ({ message, onMessageChange }) => {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);

  const encuesta = parseEncuesta(message.encuesta);
  if (!encuesta) {
    return null;
  }

  const votar = async (votoid) => {
    if (saving || !user?.ID || encuesta.cerrado) {
      return;
    }
    setSaving(true);
    try {
      const fresh = await fetchMessage({
        foro: message.INDICE,
        id: message.ID,
      });
      const freshEncuesta = parseEncuesta(fresh.encuesta);
      if (!freshEncuesta) {
        return;
      }
      freshEncuesta.options.forEach((option) => {
        if (!option.id) {
          return;
        }
        let log = option.log ? option.log.split("|").filter(Boolean) : [];
        const match = log.some((l) => Number(l) === Number(user.ID));
        if (Number(option.id) === Number(votoid)) {
          if (match) {
            option.votos = option.votos ? Number(option.votos) - 1 : 0;
            log = log.filter((l) => Number(l) !== Number(user.ID));
          } else {
            option.votos = option.votos ? Number(option.votos) + 1 : 1;
            log.push(String(user.ID));
          }
        } else if (match) {
          option.votos = option.votos ? Number(option.votos) - 1 : 0;
          log = log.filter((l) => Number(l) !== Number(user.ID));
        }
        option.log = log.join("|");
      });
      const updated = { ...fresh, encuesta: JSON.stringify(freshEncuesta) };
      const saved = await saveMessage({ message: updated });
      onMessageChange(saved && saved.ID ? saved : updated);
    } catch (err) {
      console.error("encuesta vote failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="msg-encuesta">
      <div className="msg-encuesta-header">
        <span>Votación {encuesta.cerrado ? "(cerrada)" : ""}</span>
      </div>
      {sortedOptions(encuesta.options).map((option) => {
        const voted = logHas(option.log, user?.ID);
        return (
          <div key={option.id} className="msg-encuesta-item">
            <div className="msg-encuesta-item-value">
              <span dangerouslySetInnerHTML={{ __html: option.value }} />
            </div>
            <div
              className="msg-encuesta-item-votar"
              data-votoid={option.id}
              onClick={() => votar(option.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && votar(option.id)}
            >
              {user?.ID && !encuesta.cerrado && (
                <span title={voted ? "quitar tu voto" : "vota a éste"}>
                  <i
                    className={`fa ${voted ? "fa-minus-circle" : "fa-plus-circle"}`}
                    aria-hidden="true"
                  />
                </span>
              )}
            </div>
            <div
              className="msg-encuesta-item-votos"
              data-userlist={option.log || ""}
            >
              <span>{option.votos ? option.votos : ""}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

EncuestaBlock.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    INDICE: PropTypes.string.isRequired,
    encuesta: PropTypes.string,
  }).isRequired,
  onMessageChange: PropTypes.func.isRequired,
};

export default EncuestaBlock;
