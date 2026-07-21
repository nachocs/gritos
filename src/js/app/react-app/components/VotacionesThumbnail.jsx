import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import useJsonSearch from "../hooks/useJsonSearch";

/**
 * Sidebar widget for the latest poll.
 * Migrated from votacionesThumbnailView.js.
 */
const VotacionesThumbnail = ({ foro }) => {
  const { data, loading } = useJsonSearch({
    foro,
    encontrar: "encuesta",
    max: 1,
  });

  if (!foro || loading || !data || data.length === 0) {
    return null;
  }

  const poll = data[0];
  // Matches legacy votacionesThumbnailView: only shown when there's a comment,
  // truncated to 50 chars in the serializer.
  if (!poll.comments) {
    return null;
  }
  const preview =
    poll.comments.length > 50
      ? `${poll.comments.substring(0, 50)}...`
      : poll.comments;

  return (
    <div className="votaciones-thumbnail section-container right-block">
      <Link to={`/${foro}/votaciones`} className="gotovotaciones">
        <div className="right-side-head">
          <span className="gotovotaciones">Votaciones</span>
        </div>
        <span className="gotovotaciones">{preview}</span>
      </Link>
    </div>
  );
};

VotacionesThumbnail.propTypes = {
  foro: PropTypes.string,
};

export default VotacionesThumbnail;
