import { useParams } from "react-router-dom";
import MessageDetail from "../components/MessageDetail";
import PageShell from "../components/PageShell";
import useMessage from "../hooks/useMessage";
import normalizeForo from "../utils/normalizeForo";

/**
 * Page component for a single message thread.
 * Replaces legacy routing logic for message display.
 */
const MensajePage = () => {
  const { foro, id } = useParams();
  const currentForo = normalizeForo(foro);

  // Custom hook to fetch message data by foro and ID
  const { data: message, loading, error } = useMessage(currentForo, id);

  return (
    <PageShell
      title={message?.Titulo || "Mensaje"}
      subtitle={
        message?.alias_principal ? `Por ${message.alias_principal}` : ""
      }
    >
      {loading && <div className="loading">Cargando hilo...</div>}
      {error && <div className="error">No se ha podido cargar el mensaje.</div>}
      {message && <MessageDetail message={message} currentForo={currentForo} />}
    </PageShell>
  );
};

export default MensajePage;
