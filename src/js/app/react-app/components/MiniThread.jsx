import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { fetchForumMessages, normalizeMessage } from "../utils/foroApi";
import notificacionesReadState from "../utils/notificacionesReadState";
import useSocket from "../hooks/useSocket";
import MessageItem from "./MessageItem";
import ReplyForm from "./ReplyForm";

const byNumAsc = (a, b) =>
  (Number(a.num) || Number(a.ID) || 0) - (Number(b.num) || Number(b.ID) || 0);

const dedupe = (messages) => {
  const seen = new Set();
  return messages.filter((m) => {
    const key = m.wId || `${m.INDICE}/${m.ID}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const minEntry = (batch) => {
  const nums = batch
    .map((m) => Number(m.num) || Number(m.ID))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return nums.length ? Math.min(...nums) : null;
};

const maxEntry = (batch) => {
  const nums = batch
    .map((m) => Number(m.num) || Number(m.ID))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return nums.length ? Math.max(...nums) : null;
};

/**
 * Comment thread (mini-gritos) under a message card, plus its reply form.
 * Port of legacy miniMsgCollectionView + previousMsgView: the thread lives at
 * `index.cgi?<INDICE>/<ID>/` (trailing slash = children listing), the API
 * returns newest-first, display is oldest→newest with a "load previous"
 * control at the top while entries older than the first page remain
 * (legacy condition: firstEntry > 1). New replies arrive over the
 * `collection:<INDICE>/<ID>` socket room.
 */
const MiniThread = ({ message, forceLoad }) => {
  const room = `${message.INDICE}/${message.ID}`;
  // Legacy only builds the thread when the list entry says it has minis
  // (`minimsgs` attribute) — except on the detail page, which always loads.
  const shouldLoad = forceLoad || Boolean(message.minimsgs);
  const [minis, setMinis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [firstEntry, setFirstEntry] = useState(null);
  const [noMore, setNoMore] = useState(false);

  useEffect(() => {
    if (!shouldLoad) {
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setFirstEntry(null);
    setNoMore(false);
    fetchForumMessages({ foro: `${room}/`, signal: controller.signal })
      .then((batch) => {
        setFirstEntry(minEntry(batch));
        setNoMore(batch.length === 0);
        setMinis(dedupe(batch).sort(byNumAsc));
        const lastEntry = maxEntry(batch);
        if (lastEntry !== null) {
          notificacionesReadState.update("minis", room, lastEntry);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("thread load failed:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [room, shouldLoad]);

  const handleSocketAdd = useCallback(
    (payload) => {
      const mini = normalizeMessage(payload?.entry);
      if (mini) {
        setMinis((current) => dedupe([...current, mini]).sort(byNumAsc));
        if (mini.ID) {
          notificacionesReadState.update("minis", room, mini.ID);
        }
      }
    },
    [room],
  );

  useSocket(
    shouldLoad ? `collection:${room}` : null,
    "updated",
    handleSocketAdd,
  );

  const loadPrevious = async () => {
    if (loadingPrevious || noMore || firstEntry === null) {
      return;
    }
    setLoadingPrevious(true);
    try {
      const batch = await fetchForumMessages({
        foro: `${room}/`,
        init: firstEntry,
      });
      if (!batch.length) {
        setNoMore(true);
      } else {
        const min = minEntry(batch);
        if (min !== null && (firstEntry === null || min < firstEntry)) {
          setFirstEntry(min);
        }
        const lastEntry = maxEntry(batch);
        if (lastEntry !== null) {
          notificacionesReadState.update("minis", room, lastEntry);
        }
      }
      setMinis((current) => dedupe([...current, ...batch]).sort(byNumAsc));
    } catch (err) {
      console.error("thread pagination failed:", err);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const handlePosted = (mensaje) => {
    setMinis((current) => dedupe([...current, mensaje]).sort(byNumAsc));
  };

  return (
    <>
      {shouldLoad && Number(firstEntry) > 1 && !noMore && (
        <div className="previous-msgs-view">
          <div
            className="previous-minimsgs load-previous"
            onClick={loadPrevious}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && loadPrevious()}
          >
            <i
              className={`fa fa-ellipsis-v ${loadingPrevious ? "fa-spin-fast" : ""}`}
              aria-hidden="true"
              title="¡no se vayan todavia aún hay más!"
            />
          </div>
        </div>
      )}
      {minis.length > 0 && (
        <div className="minimsgs">
          {minis.map((mini) => (
            <MessageItem
              key={mini.wId || `${mini.INDICE}/${mini.ID}`}
              message={mini}
              showForm={false}
            />
          ))}
        </div>
      )}
      <ReplyForm parent={message} onPosted={handlePosted} />
    </>
  );
};

MiniThread.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    INDICE: PropTypes.string.isRequired,
    minimsgs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  forceLoad: PropTypes.bool,
};

MiniThread.defaultProps = {
  forceLoad: false,
};

export default MiniThread;
