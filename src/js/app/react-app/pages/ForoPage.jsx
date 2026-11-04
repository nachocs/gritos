import { useParams } from "react-router-dom";
import MessageList from "../components/MessageList";
import Portada from "../components/Portada";
import PageShell from "../components/PageShell";
import Spinner from "../components/Spinner";
import useForumMessages from "../hooks/useForumMessages";
import useHead from "../hooks/useHead";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import normalizeForo from "../utils/normalizeForo";
import { mesYAnioUnix } from "../utils/tiempo";

const UN_ANIO = 365 * 24 * 3600;

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
  const esPortada = !isWall && currentForo === "foroscomun";
  const vacio = !initialLoading && !error && (messages || []).length === 0;
  // el grito mas reciente de lo cargado (la primera pagina trae los ultimos)
  const ultimo = Math.max(
    0,
    ...(messages || []).map((m) => Number(m.FECHA) || 0),
  );
  const callado =
    !esPortada && ultimo > 0 && Date.now() / 1000 - ultimo > UN_ANIO
      ? mesYAnioUnix(ultimo)
      : null;

  return (
    <PageShell>
      {initialLoading && <p>Cargando contenido del foro…</p>}
      {error && <p>Error al cargar el foro. Intenta de nuevo más tarde.</p>}
      {!initialLoading && !error && (
        <>
          {/* The foro/wall head card is rendered by Layout (as legacy does),
              so it also appears on /:foro/:id, /gallery and /votaciones. */}
          {esPortada && <Portada />}
          <section>
            {callado && (
              <p className="foro-dormido">
                {isWall ? "Este muro" : "Este foro"} lleva callado desde{" "}
                {callado}. ¿Lo despertamos? Un grito y vuelve a estar vivo.
              </p>
            )}
            {vacio && (
              <p className="foro-vacio">
                {isWall
                  ? `¡Silencio! A ${head?.Titulo || "este ciudadano"} todavía no le ha gritado nadie. Sé el primero.`
                  : "¡Silencio! Nadie ha gritado todavía aquí. Sé el primero."}
              </p>
            )}
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
            {fetchingMore && <Spinner />}
          </section>
        </>
      )}
    </PageShell>
  );
};

export default ForoPage;
