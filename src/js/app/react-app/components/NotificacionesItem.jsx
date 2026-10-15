import moment from "moment";
import PropTypes from "prop-types";
import defaultDreamy from "../../../../img/dreamy4.gif";

// Una notificacion de la bandeja (la misma de dreamers.es): el servidor ya trae el titulo ("Ana ha respondido a tu grito en king Crimson") y un
// extracto del mensaje; aqui solo se pinta. Todo entra como texto (nada de HTML).
const NotificacionesItem = ({ item, onClick }) => {
  const { titulo, texto, de_alias: deAlias, veces, actualizada, leida } = item;
  const cuando = actualizada ? moment.unix(Number(actualizada)).fromNow() : "";
  const activar = (e) => {
    if (e.key === "Enter") {
      onClick();
    }
  };
  return (
    <li
      className={`notificaciones-item${leida ? "" : " notificacion-sin-leer"}`}
      onClick={onClick}
      onKeyDown={activar}
      role="link"
      tabIndex={0}
    >
      <div className="notificaciones-dreamy">
        <img src={defaultDreamy} alt="" style={{ height: 40 }} />
      </div>
      <div className="nots-text">
        <div>
          <strong>{titulo}</strong>
          {veces > 1 ? ` (${veces})` : ""}
        </div>
        {texto && (
          <div className="nots-extracto">
            {deAlias ? `${deAlias}: ` : ""}
            {texto}
          </div>
        )}
        {cuando && <div style={{ color: "#90949c" }}>{cuando}</div>}
      </div>
    </li>
  );
};

NotificacionesItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
    titulo: PropTypes.string,
    texto: PropTypes.string,
    de_alias: PropTypes.string,
    veces: PropTypes.number,
    actualizada: PropTypes.number,
    leida: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    url: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default NotificacionesItem;
