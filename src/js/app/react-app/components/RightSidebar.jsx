import PropTypes from "prop-types";
import GalleryThumbnail from "./GalleryThumbnail";
import VotacionesThumbnail from "./VotacionesThumbnail";

/**
 * Aggregator component for the forum's right sidebar widgets.
 * Replaces src/js/app/main/right/rightView.js — legacy only ever renders a
 * gallery thumbnail and a votaciones teaser here, nothing else.
 */
// Legacy rightView hides the sidebar only when there is no foro (foroscomun),
// and otherwise hides *just the thumbnail for the view you're already on* —
// the gallery page keeps the Votaciones teaser, the votaciones page keeps the
// Galería thumbnail. Previously the whole sidebar was hidden on /gallery.
const RightSidebar = ({ foro, isGallery, isVotaciones }) => {
  if (!foro) {
    return null;
  }

  return (
    <aside className="right-side">
      {!isGallery && <GalleryThumbnail foro={foro} />}
      {!isVotaciones && <VotacionesThumbnail foro={foro} />}
    </aside>
  );
};

RightSidebar.propTypes = {
  foro: PropTypes.string,
  isGallery: PropTypes.bool,
  isVotaciones: PropTypes.bool,
};

RightSidebar.defaultProps = {
  isGallery: false,
  isVotaciones: false,
};

export default RightSidebar;
