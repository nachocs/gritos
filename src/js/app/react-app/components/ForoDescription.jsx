import PropTypes from "prop-types";

/**
 * The foro / wall head card ("foro-description"), ported from the legacy
 * mainView-t.html variants.
 *
 * Legacy renders this in the *layout*, not per-route, so the deployed app
 * shows it on every foro-scoped surface — the feed, a single message, the
 * gallery and the votaciones list all sit under the same head card. It used
 * to live inside ForoPage here, which meant it silently disappeared on
 * /:foro/:id, /:foro/gallery and /:foro/votaciones.
 *
 * Three variants, in legacy's order of precedence:
 *  - ciudadanos wall: always rendered (falls back to "Bienvenid@ a mi muro!"),
 *    with the owner's dreamy and the `ciudadano` colour treatment.
 *  - foro with a header image: text overlaid on the image.
 *  - foro without one: a plain card. Rendered only when there is intro text.
 */
const ForoDescription = ({ head, isWall }) => {
  const introHtml = head?.comments || head?.INTRODUCCION || "";
  const backgroundImage = head?.IMAGEN0_URL
    ? { backgroundImage: `url('${head.IMAGEN0_URL}')` }
    : undefined;

  if (isWall) {
    return (
      <div
        className={`foro-description mdl-card mdl-shadow--4dp conimagen ciudadano ${
          head?.IMAGEN0_URL ? "" : "sinimagen"
        }`}
        style={backgroundImage}
      >
        <div className="dreamy">
          {head?.dreamy_principal && (
            <img src={head.dreamy_principal} alt={head?.Titulo || "dreamy"} />
          )}
        </div>
        <div className="description">
          <div className="table">
            <div />
            <div className="bottom-row">
              <div
                className="mdl-card--border mdl-card__supporting-text texto-introduccion"
                dangerouslySetInnerHTML={{
                  __html: introHtml || "Bienvenid@ a mi muro!",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!introHtml) {
    return null;
  }

  if (head?.IMAGEN0_URL) {
    return (
      <div
        className="foro-description mdl-card mdl-shadow--4dp conimagen"
        style={backgroundImage}
      >
        <div />
        <div className="bottom-row">
          <div
            className="mdl-card--border mdl-card__supporting-text texto-introduccion"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="foro-description mdl-card mdl-shadow--4dp">
      <div
        className="mdl-card--border mdl-card__supporting-text"
        dangerouslySetInnerHTML={{ __html: introHtml }}
      />
    </div>
  );
};

ForoDescription.propTypes = {
  head: PropTypes.shape({
    comments: PropTypes.string,
    INTRODUCCION: PropTypes.string,
    IMAGEN0_URL: PropTypes.string,
    dreamy_principal: PropTypes.string,
    Titulo: PropTypes.string,
  }),
  isWall: PropTypes.bool,
};

ForoDescription.defaultProps = {
  isWall: false,
};

export default ForoDescription;
