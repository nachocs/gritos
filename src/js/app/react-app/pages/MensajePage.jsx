import { useParams } from "react-router-dom";
import MessageDetail from "../components/MessageDetail";
import PageShell from "../components/PageShell";
import useHead from "../hooks/useHead";
import useMessage from "../hooks/useMessage";
import normalizeForo from "../utils/normalizeForo";

/**
 * Page component for a single message thread (/:foro/:id).
 * Legacy rendered this as the foro filtered to one grito — full card with
 * its comment thread and reply form.
 */
const MensajePage = () => {
  const { foro, id } = useParams();
  const currentForo = normalizeForo(foro);

  const { data: head } = useHead(currentForo);
  const {
    data: message,
    loading,
    error,
  } = useMessage({ foro: currentForo, id });

  return (
    <PageShell>
      {loading && <div className="loading">Cargando hilo...</div>}
      {error && <div className="error">No se ha podido cargar el mensaje.</div>}
      {message && (
        <MessageDetail
          message={message}
          currentForo={currentForo}
          head={head}
        />
      )}
    </PageShell>
  );
};

export default MensajePage;
