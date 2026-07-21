import { useParams } from "react-router-dom";
import MessageList from "../components/MessageList";
import PageShell from "../components/PageShell";
import useForumMessages from "../hooks/useForumMessages";
import useHead from "../hooks/useHead";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import normalizeForo from "../utils/normalizeForo";

/**
 * Foro page — also renders ciudadanos walls (/ciudadanos/:id), which legacy
 * treated as a foro with ID "ciudadanos/<id>/" (trailing slash = children
 * listing on index.cgi) and a special wall header card.
 */
const ForoPage = () => {
  const { foro, id } = useParams();
  const isWall = !foro && Boolean(id);
  const currentForo = isWall ? `ciudadanos/${id}/` : normalizeForo(foro);
  const routeForo = isWall ? `ciudadanos/${id}` : currentForo;

  const {
    data: head,
    loading: headLoading,
    error: headError,
  } = useHead(currentForo);


  const {
    data: messages,
    loading: messagesLoading,
    fetchingMore,
    error: messagesError,
    nextPage,
    noMoreEntries,
  } = useForumMessages(currentForo);

  useInfiniteScroll(nextPage, {
    disabled: noMoreEntries || messagesLoading,
    fetchingMore,
  });

  const initialLoading = headLoading || messagesLoading;
  const error = headError || messagesError;

  return (
    <PageShell>
      {initialLoading && <p>Cargando contenido del foro…</p>}
      {error && <p>Error al cargar el foro. Intenta de nuevo más tarde.</p>}
      {!initialLoading && !error && (
        <>
          {/* The foro/wall head card is rendered by Layout (as legacy does),
              so it also appears on /:foro/:id, /gallery and /votaciones. */}
          <section>
            <MessageList
              messages={messages}
              currentForo={routeForo}
              head={head}
            />
            {!initialLoading && !fetchingMore && !noMoreEntries && (
              <button
                type="button"
                className="mdl-button mdl-js-button mdl-button--raised"
                onClick={nextPage}
              >
                Cargar más mensajes
              </button>
            )}
            {fetchingMore && <p>Cargando más mensajes…</p>}
          </section>
        </>
      )}
    </PageShell>
  );
};

export default ForoPage;
