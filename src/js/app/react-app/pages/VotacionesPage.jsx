import { useMemo } from "react";
import { useParams } from "react-router-dom";
import MessageList from "../components/MessageList";
import PageShell from "../components/PageShell";
import Spinner from "../components/Spinner";
import useHead from "../hooks/useHead";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import useJsonSearch from "../hooks/useJsonSearch";
import { normalizeMessage } from "../utils/foroApi";
import normalizeForo from "../utils/normalizeForo";

/**
 * Votaciones view — legacy rendered the same message cards as the foro, but
 * filtered to entries that carry a poll (`encontrar: "encuesta"`). The composer
 * stays visible (it lives in Layout); only the listing is poll-only.
 */
const VotacionesPage = () => {
  const { foro, id } = useParams();
  // /ciudadanos/:id/votaciones — the wall's polls.
  const isWall = foro === "ciudadanos" && Boolean(id);
  const currentForo = isWall ? `ciudadanos/${id}` : normalizeForo(foro);

  const { data: head } = useHead(currentForo);
  const {
    data: entries,
    loading,
    fetchingMore,
    error,
    nextPage,
    noMoreEntries,
  } = useJsonSearch({ foro: currentForo, encontrar: "encuesta" });

  const messages = useMemo(
    () => entries.map(normalizeMessage).filter(Boolean),
    [entries],
  );

  useInfiniteScroll(nextPage, {
    disabled: noMoreEntries || loading,
    fetchingMore,
  });

  const title = head?.Titulo
    ? `Votaciones de ${head.Titulo}`
    : `Votaciones del foro ${currentForo}`;

  return (
    <PageShell>
      {loading && <p>Cargando votaciones…</p>}
      {error && <p>Error al cargar las votaciones.</p>}
      {!loading && !error && (
        <section>
          {messages.length === 0 ? (
            <p>No hay votaciones disponibles.</p>
          ) : (
            <MessageList
              messages={messages}
              currentForo={currentForo}
              head={head}
            />
          )}
          {fetchingMore && <Spinner />}
        </section>
      )}
    </PageShell>
  );
};

export default VotacionesPage;
