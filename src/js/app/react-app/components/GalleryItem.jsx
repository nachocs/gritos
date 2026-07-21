import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";

/**
 * A single gallery tile. Port of legacy galleryMsgView.html: an image-only
 * square (no title/description text) with a hover "forward" chevron linking to
 * the message. Uses IMAGEN0_URL, falling back to IMAGEN1_URL like the template.
 */
const GalleryItem = ({ entry, currentForo }) => {
  const navigate = useNavigate();
  const imageUrl = entry.IMAGEN0_URL || entry.IMAGEN1_URL;
  if (!imageUrl) {
    return null;
  }

  const entryId = entry.ID || entry.wId;
  const messageLink = `/${currentForo}/${entryId}`;

  return (
    <div className="gallery-entry">
      <div className="action-icons">
        <div className="forward">
          <Link to={messageLink}>
            <i className="fa fa-chevron-circle-right fa-lg" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div
        className="img-gallery"
        role="button"
        tabIndex={0}
        style={{ backgroundImage: `url(${imageUrl})` }}
        onClick={() => navigate(messageLink)}
        onKeyDown={(e) => e.key === "Enter" && navigate(messageLink)}
      />
    </div>
  );
};

GalleryItem.propTypes = {
  entry: PropTypes.object.isRequired,
  currentForo: PropTypes.string.isRequired,
};

export default GalleryItem;
