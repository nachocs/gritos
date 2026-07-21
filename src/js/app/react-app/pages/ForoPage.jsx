import { useParams } from "react-router-dom";
import MessageList from "../components/MessageList";
import PageShell from "../components/PageShell";
import { useUser } from "../hooks/useContexts";
import useForumMessages from "../hooks/useForumMessages";
import useHead from "../hooks/useHead";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { openModal } from "../utils/modalEvents";
import normalizeForo from "../utils/normalizeForo";

// Legacy mainView-t.html gear condition: the foro's owner (listed in the
// pipe-separated Userid), the wall's owner on a ciudadanos wall, or a
// super-admin (nivel > 7). Never on foroscomun / headless foros.
const canAdminForo = (head, user) => {
  if (!head || !user?.ID || !head.INDICE || head.INDICE === "foroscomun") {
    return false;
  }
  const owners = head.Userid ? String(head.Userid).split("|") : [];
  return (
    owners.includes(String(user.ID)) ||
    (head.INDICE === "ciudadanos" && String(user.ID) === String(head.ID)) ||
    Number(user.nivel) > 7
  );
};

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

  const { user } = useUser();

  const {
    data: messages,
    loading: messagesLoading,
    fetchingMore,
    error: messagesError,
    nextPage,
    noMoreEntries,
  } = useForumMessages(currentForo);

  // Legacy openForoAdmin(): edit the foro/wall head via the existing edit modal.
  const openForoAdmin = () => {
    openModal({
      model: {
        show: true,
        header: head?.INDICE === "ciudadanos" ? "EDITA TU MURO" : "EDITAR FORO",
      },
      editForm: { msg: head, isHead: true },
    });
  };

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
          {canAdminForo(head, user) && (
            <div
              className="foro-admin"
              role="button"
              tabIndex={0}
              title="Editar foro"
              onClick={openForoAdmin}
              onKeyDown={(e) => e.key === "Enter" && openForoAdmin()}
            >
              <i className="fa fa-cog fa-lg" aria-hidden="true" />
            </div>
          )}
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
