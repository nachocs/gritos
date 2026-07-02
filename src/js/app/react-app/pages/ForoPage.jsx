import { useContext, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import MessageList from "../components/MessageList";
import PageShell from "../components/PageShell";
import ScrollRootContext from "../contexts/ScrollRootContext";
import useForumMessages from "../hooks/useForumMessages";
import useHead from "../hooks/useHead";
import normalizeForo from "../utils/normalizeForo";

const ForoPage = () => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const title =
    currentForo === "foroscomun" ? "Foros Común" : `Foro: ${currentForo}`;

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

  const scrollRootRef = useContext(ScrollRootContext);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (
      !sentinelRef.current ||
      fetchingMore ||
      noMoreEntries ||
      messagesLoading
    ) {
      return undefined;
    }

    const root = scrollRootRef?.current || null;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          nextPage();
        }
      },
      {
        root,
        rootMargin: "200px",
        threshold: 0.1,
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetchingMore, noMoreEntries, messagesLoading, nextPage, scrollRootRef]);

  const initialLoading = headLoading || messagesLoading;
  const error = headError || messagesError;
  const introHtml = head?.INTRODUCCION || "Cargando introducción del foro...";

  return (
    <PageShell title={title} subtitle={head?.Titulo || "Cargando foro..."}>
      {initialLoading && <p>Cargando contenido del foro…</p>}
      {error && <p>Error al cargar el foro. Intenta de nuevo más tarde.</p>}
      {!initialLoading && !error && (
        <>
          <div
            className="foro-intro"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
          <section>
            <h3>Mensajes recientes</h3>
            <MessageList messages={messages} currentForo={currentForo} />
            <div
              ref={sentinelRef}
              aria-hidden="true"
              style={{ height: 1, width: "100%" }}
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
