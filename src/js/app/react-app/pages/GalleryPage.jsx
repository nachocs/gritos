import { useParams } from "react-router-dom";
import GalleryItem from "../components/GalleryItem";
import PageShell from "../components/PageShell";
import Spinner from "../components/Spinner";
import useHead from "../hooks/useHead";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import useJsonSearch from "../hooks/useJsonSearch";
import normalizeForo from "../utils/normalizeForo";

/**
 * Gallery view — legacy galleryView: an image-tile grid of the foro's entries
 * that carry a picture (`encontrar: "Ficheros"`), no text, with infinite
 * scroll. The composer is hidden on this route (see Layout).
 */
const GalleryPage = () => {
  const { foro, id } = useParams();
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
  } = useJsonSearch({ foro: currentForo, encontrar: "Ficheros" });

  useInfiniteScroll(nextPage, {
    disabled: noMoreEntries || loading,
    fetchingMore,
  });

  const subtitle = head?.Titulo
    ? `Galería de ${head.Titulo}`
    : `Galería del foro ${currentForo}`;

  return (
    <PageShell>
      {loading && <p>Cargando galería…</p>}
      {error && <p>Error al cargar la galería.</p>}
      {!loading && !error && (
        <>
          {entries.length === 0 ? (
            <p>No hay elementos en la galería todavía.</p>
          ) : (
            <div className="gallery">
              {entries.map((entry) => (
                <GalleryItem
                  key={entry.wId || `${entry.INDICE}-${entry.ID}`}
                  entry={entry}
                  currentForo={currentForo}
                />
              ))}
            </div>
          )}
          {fetchingMore && <Spinner />}
        </>
      )}
    </PageShell>
  );
};

export default GalleryPage;
