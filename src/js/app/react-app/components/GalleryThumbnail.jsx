import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import useJsonSearch from "../hooks/useJsonSearch";

/**
 * Sidebar thumbnail for the gallery.
 * Migrated from galleryThumbnailView.js.
 */
const GalleryThumbnail = ({ foro }) => {
  const { data, loading } = useJsonSearch({
    foro,
    encontrar: "IMAGEN0_THUMB",
    max: 1,
  });

  if (loading || !data || data.length === 0) {
    return null;
  }

  const entry = data[0];
  const thumbUrl = entry.IMAGEN0_THUMB_URL || entry.IMAGEN0_URL;

  if (!thumbUrl) return null;

  return (
    <div className="gallery-thumbnail section-container">
      <Link to={`/${foro}/gallery`} title="Ver galería">
        <div className="thumbnail-wrapper">
          <img src={thumbUrl} alt="Galería" className="img-thumbnail" />
          <div className="thumbnail-overlay">
            <i className="material-icons">photo_library</i>
          </div>
        </div>
      </Link>
    </div>
  );
};

GalleryThumbnail.propTypes = {
  foro: PropTypes.string.isRequired,
};

export default GalleryThumbnail;
