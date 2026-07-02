import PropTypes from "prop-types";
import NotificacionesItem from "./NotificacionesItem";

const NotificacionesList = ({ items, onItemClick }) => (
  <ul className="notificaciones-list">
    {items.length === 0 ? (
      <li className="notificacion-empty">No tienes nuevas notificaciones</li>
    ) : (
      items.map((item) => (
        <NotificacionesItem
          key={item.cid || item.id || `notif-${Math.random()}`}
          item={item}
          onClick={() => onItemClick(item)}
        />
      ))
    )}
  </ul>
);

NotificacionesList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      cid: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      tipo: PropTypes.string,
      indice: PropTypes.string,
      entry: PropTypes.object,
      head: PropTypes.object,
      parent: PropTypes.object,
      subtipo: PropTypes.string,
    }),
  ).isRequired,
  onItemClick: PropTypes.func.isRequired,
};

export default NotificacionesList;
