import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSearchIndice, fetchJsonSearch } from "../utils/foroApi";

const getEntryId = (entry) => entry?.ID ?? entry?.id ?? entry?.wId;

const getNextLast = (entries) => {
  const ids = entries.map(getEntryId).filter((id) => id !== undefined);
  if (!ids.length) {
    return null;
  }
  const numericIds = ids.map(Number).filter((id) => !Number.isNaN(id));
  if (!numericIds.length) {
    return null;
  }
  return Math.min(...numericIds);
};

const uniqueById = (entries) => {
  const seen = new Set();
  return entries.filter((entry, index) => {
    const key =
      entry?.wId ||
      `${entry?.INDICE || ""}/${entry?.ID || entry?.id || index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const useJsonSearch = ({ foro, encontrar, max = 10 }) => {
  const indice = useMemo(() => buildSearchIndice(foro), [foro]);
  const lastRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(indice));
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [noMoreEntries, setNoMoreEntries] = useState(!indice);

  useEffect(() => {
    if (!indice) {
      lastRef.current = null;
      setData([]);
      setLoading(false);
      setFetchingMore(false);
      setError(null);
      setNoMoreEntries(true);
      return undefined;
    }

    const controller = new AbortController();
    lastRef.current = null;
    loadingMoreRef.current = false;
    setLoading(true);
    setFetchingMore(false);
    setError(null);
    setNoMoreEntries(false);

    fetchJsonSearch({
      indice,
      encontrar,
      max,
      signal: controller.signal,
    })
      .then((entries) => {
        setData(uniqueById(entries));
        lastRef.current = getNextLast(entries);
        setNoMoreEntries(entries.length < max);
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
  }, [encontrar, indice, max]);

  const nextPage = useCallback(() => {
    if (
      !indice ||
      loadingMoreRef.current ||
      noMoreEntries ||
      lastRef.current === null
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setFetchingMore(true);
    setError(null);

    fetchJsonSearch({
      indice,
      encontrar,
      max,
      last: lastRef.current,
    })
      .then((entries) => {
        setData((current) => uniqueById([...current, ...entries]));
        lastRef.current = getNextLast(entries);
        setNoMoreEntries(entries.length < max || lastRef.current === null);
      })
      .catch((fetchError) => {
        setError(fetchError);
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setFetchingMore(false);
      });
  }, [encontrar, indice, max, noMoreEntries]);

  return {
    data,
    loading,
    fetchingMore,
    error,
    nextPage,
    noMoreEntries,
    indice,
  };
};

export default useJsonSearch;
