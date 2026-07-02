import { useEffect, useState } from "react";
import { fetchHead } from "../utils/foroApi";

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

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchHead({ name, signal: controller.signal })
      .then((head) => {
        setData(head);
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
  }, [name]);

  return { data, loading, error };
};

export default useHead;
