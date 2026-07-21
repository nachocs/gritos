import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mockup from "../../util/mockups";
import { publishAviso } from "../utils/avisosEvents";
import { fetchForumMessages, normalizeMessage } from "../utils/foroApi";
import { onNewMessage } from "../utils/messageEvents";
import notificacionesReadState from "../utils/notificacionesReadState";
import useSocket from "./useSocket";

const getMessageKey = (message, index) =>
  message?.wId ||
  `${message?.INDICE || ""}/${message?.ID || message?.id || index}`;

const uniqueById = (messages) => {
  const seen = new Set();
  return messages.filter(
    (m, i) => !seen.has(getMessageKey(m, i)) && seen.add(getMessageKey(m, i)),
  );
};

const getFirstEntry = (messages) => {
  const nums = messages
    .map((message) => Number(message?.num))
    .filter((num) => !Number.isNaN(num));
  return nums.length ? Math.min(...nums) : null;
};

const getLastEntry = (messages) => {
  const nums = messages
    .map((message) => Number(message?.num))
    .filter((num) => !Number.isNaN(num));
  return nums.length ? Math.max(...nums) : null;
};

const useForumMessages = (foro) => {
  const firstEntryRef = useRef(null);
  const fetchingMoreRef = useRef(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(foro));
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [noMoreEntries, setNoMoreEntries] = useState(false);

  useEffect(() => {
    if (!foro) {
      firstEntryRef.current = null;
      setData([]);
      setLoading(false);
      setFetchingMore(false);
      setError(null);
      setNoMoreEntries(true);
      return undefined;
    }

    const controller = new AbortController();
    firstEntryRef.current = null;
    fetchingMoreRef.current = false;
    setLoading(true);
    setFetchingMore(false);
    setError(null);
    setNoMoreEntries(false);

    const load = mockup.active
      ? Promise.resolve(mockup.msgCollectionMockup.map(normalizeMessage))
      : fetchForumMessages({ foro, max: 20, signal: controller.signal });

    load
      .then((messages) => {
        setData(uniqueById(messages));
        firstEntryRef.current = getFirstEntry(messages);
        setNoMoreEntries(messages.length === 0);
        const lastEntry = getLastEntry(messages);
        if (lastEntry !== null) {
          notificacionesReadState.update("foro", foro.replace(/\/$/, ""), lastEntry);
        }
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [foro]);

  const socketRoom = useMemo(
    () => (foro ? `collection:${foro.replace(/\/$/, "")}` : null),
    [foro],
  );

  const handleUpdate = useCallback(
    (payload) => {
      const message = normalizeMessage(payload?.entry);
      if (message) {
        setData((current) => uniqueById([message, ...current]));
        publishAviso(payload);
        if (foro && message.ID) {
          notificacionesReadState.update("foro", foro.replace(/\/$/, ""), message.ID);
        }
      }
    },
    [foro],
  );

  useSocket(socketRoom, "updated", handleUpdate);

  // Insert the poster's own message immediately, matching legacy's direct
  // collection.add() on submit success — doesn't depend on a socket echo,
  // which the default foroscomun foro never even triggers (no room is set).
  useEffect(() => {
    if (!foro) {
      return undefined;
    }
    return onNewMessage(({ foro: messageForo, message }) => {
      if (messageForo !== foro) {
        return;
      }
      setData((current) => uniqueById([message, ...current]));
    });
  }, [foro]);

  const nextPage = useCallback(() => {
    if (
      !foro ||
      fetchingMoreRef.current ||
      noMoreEntries ||
      firstEntryRef.current === null ||
      mockup.active
    ) {
      return Promise.resolve();
    }

    fetchingMoreRef.current = true;
    setFetchingMore(true);
    setError(null);

    return fetchForumMessages({ foro, init: firstEntryRef.current, max: 20 })
      .then((messages) => {
        setData((current) => uniqueById([...current, ...messages]));
        firstEntryRef.current = getFirstEntry(messages);
        setNoMoreEntries(
          messages.length === 0 || firstEntryRef.current === null,
        );
        const lastEntry = getLastEntry(messages);
        if (lastEntry !== null) {
          notificacionesReadState.update("foro", foro.replace(/\/$/, ""), lastEntry);
        }
      })
      .catch((fetchError) => {
        setError(fetchError);
      })
      .finally(() => {
        fetchingMoreRef.current = false;
        setFetchingMore(false);
      });
  }, [foro, noMoreEntries]);

  return {
    data,
    loading,
    fetchingMore,
    error,
    nextPage,
    noMoreEntries,
  };
};

export default useForumMessages;
