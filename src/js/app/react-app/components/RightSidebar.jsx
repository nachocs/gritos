import PropTypes from "prop-types";
import MiniMessageList from "../../MiniMessageList";
import useJsonSearch from "../hooks/useJsonSearch";
import GalleryThumbnail from "./GalleryThumbnail";
import VotacionesThumbnail from "./VotacionesThumbnail";

/**
 * Aggregator component for the forum's right sidebar widgets.
 * Replaces src/js/app/main/right/ folder views.
 */
const RightSidebar = ({ foro }) => {
  // Fetch the summary/resumen messages for the sidebar
  const { data: resumenMsgs, loading: loadingResumen } = useJsonSearch({
    foro,
    encontrar: "Resumen",
    max: 5,
  });

  return (
    <aside className="right-sidebar">
      {/* Gallery Section */}
      <div className="sidebar-section">
        <h3 className="section-title">Imágenes</h3>
        <GalleryThumbnail foro={foro} />
      </div>

      {/* Polls Section */}
      <VotacionesThumbnail foro={foro} />

      {/* Resumen / Compact Message List Section */}
      <div className="sidebar-section">
        <h3 className="section-title">Últimos Gritos</h3>
        <MiniMessageList
          messages={resumenMsgs}
          currentForo={foro}
          isLoading={loadingResumen}
        />
      </div>
    </aside>
  );
};

RightSidebar.propTypes = {
  foro: PropTypes.string.isRequired,
};

export default RightSidebar;
