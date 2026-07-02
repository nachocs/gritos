import PropTypes from "prop-types";
import { Link } from "react-router-dom";

/**
 * Individual item for the gallery list.
 * Migrated from galleryMsgView logic.
 */
const GalleryItem = ({ entry, currentForo }) => {
  const imageUrl =
    entry.IMAGEN0_URL ||
    entry.IMAGEN1_URL ||
    entry.IMAGEN0_THUMB_URL ||
    entry.IMAGEN1_THUMB_URL;

  const entryId = entry.ID || entry.wId || `${entry.INDICE}-${entry.ID}`;
  const messageLink = `/${currentForo}/${entryId}`;

  return (
    <li className="gallery-entry">
      <Link to={messageLink} className="gallery-entry__link">
        {imageUrl ? (
          <div
            className="gallery-entry__image"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ) : (
          <div className="gallery-entry__placeholder">Sin imagen</div>
        )}
        <div className="gallery-entry__info">
          <strong>{entry.Titulo || `Elemento ${entryId}`}</strong>
          <div>
            {entry.SUBJECT ||
              entry.COMMENTS ||
              entry.comments ||
              "Sin descripción."}
          </div>
        </div>
      </Link>
    </li>
  );
};

GalleryItem.propTypes = {
  entry: PropTypes.object.isRequired,
  currentForo: PropTypes.string.isRequired,
};

export default GalleryItem;
