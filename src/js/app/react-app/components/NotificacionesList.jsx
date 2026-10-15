import PropTypes from "prop-types";
import NotificacionesItem from "./NotificacionesItem";

// Legacy's collection view is a <ul class="mdl-shadow--4dp">; the styling
// (white bg, padding, list-style:none, per-item shadow) comes from
// `.notificaciones-collection-view ul`/`li` in main.less, so the wrapper class
// matters more than the ul's own.
const NotificacionesList = ({ items, onItemClick }) => (
  <ul className="notificaciones-list mdl-shadow--4dp">
    {items.length === 0 ? (
      <li className="notificacion-empty">Aquí verás cuándo contesten a tus gritos, comenten en tus foros o te den un mola</li>
    ) : (
      items.map((item) => (
        <NotificacionesItem
          key={item.id}
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
      id: PropTypes.number,
      clave: PropTypes.string,
      titulo: PropTypes.string,
    }),
  ).isRequired,
  onItemClick: PropTypes.func.isRequired,
};

export default NotificacionesList;
