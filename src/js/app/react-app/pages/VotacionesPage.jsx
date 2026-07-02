import { useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import useJsonSearch from "../hooks/useJsonSearch";
import normalizeForo from "../utils/normalizeForo";

const VotacionesPage = () => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const {
    data: votes,
    loading,
    error,
  } = useJsonSearch({
    foro: currentForo,
    encontrar: "encuesta",
  });

  return (
    <PageShell
      title="Votaciones"
      subtitle={`Votaciones del foro ${currentForo}`}
    >
      {loading && <p>Cargando votaciones…</p>}
      {error && <p>Error al cargar las votaciones.</p>}
      {!loading && !error && (
        <>
          {votes.length === 0 ? (
            <p>No hay votaciones disponibles.</p>
          ) : (
            <ul>
              {votes.map((vote) => (
                <li key={vote.ID || vote.wId || `${vote.INDICE}-${vote.ID}`}>
                  <strong>{vote.Titulo || vote.ID || vote.wId}</strong>
                  <div>
                    {vote.SUBJECT ||
                      vote.COMMENTS ||
                      vote.comments ||
                      "Sin descripción."}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PageShell>
  );
};

export default VotacionesPage;
