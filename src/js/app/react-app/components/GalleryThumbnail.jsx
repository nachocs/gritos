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
    encontrar: "Ficheros",
    max: 1,
  });

  if (!foro || loading || !data || data.length === 0) {
    return null;
  }

  const entry = data[0];
  // Matches legacy galleryThumbnailView.html field precedence.
  const thumbUrl =
    entry.IMAGEN0_THUMB || entry.IMAGEN1_THUMB_URL || entry.IMAGEN1_URL;

  if (!thumbUrl) return null;

  // Matches legacy galleryThumbnailView.html: a `right-side-head` "Galería"
  // caption above the thumbnail, both carrying the `gotogallery` class that
  // main.less styles/sizes. The previous `thumbnail-overlay` + photo_library
  // material icon had no counterpart in the deployed sidebar.
  return (
    <div className="gallery-thumbnail section-container right-block">
      <Link to={`/${foro}/gallery`} title="Ver galería">
        <div className="right-side-head">
          <span className="gotogallery">Galería</span>
        </div>
        <img src={thumbUrl} alt="Galería" className="gotogallery" />
      </Link>
    </div>
  );
};

GalleryThumbnail.propTypes = {
  foro: PropTypes.string,
};

export default GalleryThumbnail;
