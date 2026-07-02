import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mockup from "../../util/mockups";
import { publishAviso } from "../utils/avisosEvents";
import { fetchForumMessages, normalizeMessage } from "../utils/foroApi";
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
      : fetchForumMessages({ foro, signal: controller.signal });

    load
      .then((messages) => {
        setData(uniqueById(messages));
        firstEntryRef.current = getFirstEntry(messages);
        setNoMoreEntries(messages.length === 0);
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

  const handleUpdate = useCallback((payload) => {
    const message = normalizeMessage(payload?.entry);
    if (message) {
      setData((current) => uniqueById([message, ...current]));
      publishAviso(payload);
    }
  }, []);

  useSocket(socketRoom, "updated", handleUpdate);

  const nextPage = useCallback(() => {
    if (
      !foro ||
      fetchingMoreRef.current ||
      noMoreEntries ||
      firstEntryRef.current === null ||
      mockup.active
    ) {
      return;
    }

    fetchingMoreRef.current = true;
    setFetchingMore(true);
    setError(null);

    fetchForumMessages({ foro, init: firstEntryRef.current })
      .then((messages) => {
        setData((current) => uniqueById([...current, ...messages]));
        firstEntryRef.current = getFirstEntry(messages);
        setNoMoreEntries(
          messages.length === 0 || firstEntryRef.current === null,
        );
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
