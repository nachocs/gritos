import moment from "moment";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const normalizeRouteForo = (indice, currentForo) => {
  if (!indice) {
    return currentForo;
  }
  return indice.replace(/^gritos\//, "");
};

const getImageIndexes = (message) => {
  const indexes = new Set();
  Object.keys(message).forEach((key) => {
    const match = key.match(/^IMAGEN(\d+)_/);
    if (match) {
      indexes.add(Number(match[1]));
    }
  });
  return Array.from(indexes).sort((a, b) => a - b);
};

const getImageSource = (message, index) =>
  message[`IMAGEN${index}_URL`] ||
  message[`IMAGEN${index}_THUMB_URL`] ||
  message[`IMAGEN${index}_THUMB`];

const getImageDimensions = (message, index) => {
  const width =
    message[`IMAGEN${index}_ancho`] || message[`IMAGEN${index}_ANCHO`];
  const height =
    message[`IMAGEN${index}_alto`] || message[`IMAGEN${index}_ALTO`];
  return {
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
  };
};

const formatMessageTime = (value) => {
  if (!value) {
    return null;
  }
  const unixValue = Number(value);
  if (!Number.isNaN(unixValue) && unixValue > 0) {
    return moment.unix(unixValue).fromNow(true);
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed.fromNow(true) : null;
};

const getImages = (message) =>
  getImageIndexes(message)
    .map((index) => {
      const src = getImageSource(message, index);
      if (!src) {
        return null;
      }
      const { width, height } = getImageDimensions(message, index);
      return { src, width, height };
    })
    .filter(Boolean);

const MessageItem = ({ message, currentForo }) => {
  const id =
    message.ID ||
    message.wId ||
    `${message.INDICE || currentForo}-${message.ID || message.wId}`;
  const routeForo = normalizeRouteForo(message.INDICE, currentForo);
  const messageLink = `/${routeForo}/${id}`;
  const title = message.Titulo || `Mensaje ${message.ID || id}`;
  const displayName =
    message.name ||
    message.NOMBRE ||
    message.nombre ||
    message.ciudadano ||
    "Anónimo";
  const authorLink = message.ciudadano
    ? `/ciudadanos/${message.ciudadano}`
    : null;
  const showForm = message.showForm !== false;
  const content =
    message.COMMENTS || message.comments || message.INTRODUCCION || "";
  const date = formatMessageTime(
    message.FECHA || message.date || message.fecha || null,
  );
  const emotionUrl = message.emocion || message.EMOCION || message.emotion;
  const images = getImages(message);

  return (
    <article className="msg">
      {emotionUrl && (
        <div
          className="emocion"
          style={{ backgroundImage: `url(${emotionUrl})` }}
        />
      )}
      <div className="mdl-card mdl-shadow--4dp">
        {showForm && (
          <div className="action-icons">
            <div className="forward">
              <Link to={messageLink}>
                <i
                  className="fa fa-chevron-circle-right fa-lg"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        )}
        {images.length > 0 && (
          <div className="images-place">
            {images.map((image, index) => {
              const isVertical =
                image.height && image.width
                  ? image.height > image.width
                  : false;
              const wrapperClass = isVertical ? "msg-img-vertical" : "msg-img";
              const style = {};
              if (image.width) {
                style.maxWidth = `${image.width}px`;
              }
              if (image.height) {
                style.maxHeight = `${image.height}px`;
              }
              return (
                <div key={index} className={wrapperClass} style={style}>
                  <img src={image.src} alt={title} />
                </div>
              );
            })}
          </div>
        )}
        <div className="mdl-card__title">
          <div className="mdl-card__title-text">
            {authorLink ? (
              <Link to={authorLink}>{displayName}</Link>
            ) : (
              displayName
            )}
          </div>
          {date && <div className="mdl-card__subtitle-text">{date}</div>}
          {showForm && <div className="rabito" />}
        </div>
        <div className="mdl-card__supporting-text">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p>Sin contenido disponible.</p>
          )}
        </div>
        <div className="foot">
          <div className="mola-view" />
        </div>
      </div>
    </article>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    wId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    INDICE: PropTypes.string,
    Titulo: PropTypes.string,
    FECHA: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fecha: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    COMMENTS: PropTypes.string,
    comments: PropTypes.string,
    INTRODUCCION: PropTypes.string,
    nombre: PropTypes.string,
    NOMBRE: PropTypes.string,
    ciudadano: PropTypes.string,
    emocion: PropTypes.string,
    showForm: PropTypes.bool,
  }).isRequired,
  currentForo: PropTypes.string,
};

MessageItem.defaultProps = {
  currentForo: "foroscomun",
};

export default MessageItem;
