import { useParams } from "react-router-dom";
import GalleryItem from "../components/GalleryItem";
import PageShell from "../components/PageShell";
import useJsonSearch from "../hooks/useJsonSearch";
import normalizeForo from "../utils/normalizeForo";

const GalleryPage = () => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const {
    data: entries,
    loading,
    error,
  } = useJsonSearch({
    foro: currentForo,
    encontrar: "Ficheros",
  });

  return (
    <PageShell title="Galería" subtitle={`Galería del foro ${currentForo}`}>
      {loading && <p>Cargando galería…</p>}
      {error && <p>Error al cargar la galería.</p>}
      {!loading && !error && (
        <>
          {entries.length === 0 ? (
            <p>No hay elementos en la galería todavía.</p>
          ) : (
            <ul className="gallery-list">
              {entries.map((entry) => {
                const entryId =
                  entry.ID || entry.wId || `${entry.INDICE}-${entry.ID}`;
                return (
                  <GalleryItem
                    key={entryId}
                    entry={entry}
                    currentForo={currentForo}
                  />
                );
              })}
            </ul>
          )}
        </>
      )}
    </PageShell>
  );
};

export default GalleryPage;
