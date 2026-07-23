import { useEffect, useState } from "react";
import { fetchHead } from "../utils/foroApi";
import { onHeadUpdate } from "../utils/headEvents";

// Several components need the same foro head at once (Layout/Header for the
// title bar, ForoPage for the description card + admin gating, FormShell for
// the composer target, Gallery/Votaciones/Mensaje). Without this they each
// fire their own head.cgi GET for the same name on every page load. Dedupe
// only *concurrent in-flight* requests — deliberately not a result cache, so
// a fresh mount for a *different* name always fetches for real.
const inFlight = new Map();

// A ciudadanos wall is fetched as "ciudadanos/<id>/" (the trailing slash is
// what makes index.cgi list children) but ForoAdmin publishes the head's own
// `INDICE`, which has none — compare with the slash stripped either way.
const stripSlash = (value) => (value || "").replace(/\/$/, "");

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

  // Editing the head via the admin gear doesn't change `name`, so the effect
  // above never re-runs on its own — without this every consumer kept
  // showing the pre-edit head until a reload.
  useEffect(() => {
    if (!name) {
      return undefined;
    }
    return onHeadUpdate(({ name: updatedName, head }) => {
      if (stripSlash(updatedName) === stripSlash(name)) {
        setData(head);
      }
    });
  }, [name]);

  return { data, loading, error };
};

export default useHead;
