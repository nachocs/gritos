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
    encontrar: "VOTACION",
    max: 1,
  });

  if (loading || !data || data.length === 0) {
    return null;
  }

  const poll = data[0];
  // Use the ID or Title for the link; if it's a general list, just go to the page
  const pollTitle = poll.Titulo || poll.INDICE || "Votación activa";

  return (
    <div className="votaciones-thumbnail section-container">
      <h3 className="section-title">Encuesta</h3>
      <div className="thumbnail-card mdl-card mdl-shadow--2dp">
        <div className="mdl-card__title">
          <h2 className="mdl-card__title-text">{pollTitle}</h2>
        </div>
        <div className="mdl-card__supporting-text">
          Participa en las votaciones de la comunidad.
        </div>
        <div className="mdl-card__actions mdl-card--border">
          <Link
            to={`/${foro}/votaciones`}
            className="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect"
          >
            Ver Votaciones
          </Link>
        </div>
      </div>
    </div>
  );
};

VotacionesThumbnail.propTypes = {
  foro: PropTypes.string.isRequired,
};

export default VotacionesThumbnail;
