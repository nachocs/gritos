import { useEffect, useState } from "react";
import { fetchHead } from "../utils/foroApi";

// Several components need the same foro head at once (Layout/Header for the
// title bar, ForoPage for the description card + admin gating, FormShell for
// the composer target, Gallery/Votaciones/Mensaje). Without this they each
// fire their own head.cgi GET for the same name on every page load. Dedupe
// only *concurrent in-flight* requests — deliberately not a result cache, so
// a later mount (e.g. after editing the head via the admin gear) refetches
// and never renders stale data.
const inFlight = new Map();

const fetchHeadShared = (name) => {
  if (inFlight.has(name)) {
    return inFlight.get(name);
  }
  const promise = fetchHead({ name }).finally(() => {
    inFlight.delete(name);
  });
  inFlight.set(name, promise);
  return promise;
};

const useHead = (name) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(name));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!name) {
      setData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    // The shared request isn't tied to this consumer's lifetime, so guard
    // state updates with a flag instead of aborting it out from under others.
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHeadShared(name)
      .then((head) => {
        if (!cancelled) {
          setData(head);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  return { data, loading, error };
};

export default useHead;
