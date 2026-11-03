import { decode } from "html-entities";
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
  // `comments` llega como HTML del motor (entidades y etiquetas): cortarlo en
  // crudo mostraba «C&oacute;mic <div>Titulado:». Primero a texto, luego se corta.
  const texto = decode(poll.comments.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  const preview = texto.length > 50 ? `${texto.substring(0, 50)}...` : texto;

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
