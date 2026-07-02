import { useEffect, useState } from "react";
import { fetchMessage } from "../utils/foroApi";

const useMessage = ({ foro, id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(foro && id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!foro || !id) {
      setData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchMessage({ foro, id, signal: controller.signal })
      .then((message) => {
        setData(message);
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
  }, [foro, id]);

  return { data, loading, error };
};

export default useMessage;
