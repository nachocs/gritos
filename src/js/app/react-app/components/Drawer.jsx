import PropTypes from "prop-types";
import ResumenNav from "./ResumenNav";

// `open` toggles MDL's `is-visible` class (the CDN MDL CSS handles the slide
// transform); the drawer is React-controlled since MDL's JS never upgrades it.
// The "privacidad / legal" link legacy pins at the bottom lives in ResumenNav,
// matching legacy's split (mainView-t.html owns the title, resumenView-t.html
// the nav and the link).
// `arriba`: el buscador de foros, antes de la lista; `children`: lo que va al final
// (el interruptor de tema en movil).
const Drawer = ({
  open = false,
  head = null,
  arriba = null,
  children = null,
}) => (
  <div className={`mdl-layout__drawer${open ? " is-visible" : ""}`}>
    {/* Legacy mainView-t.html renders `<%= obj.Titulo %>` here — the current
        head's title, not a constant. It was hard-coded to "Gritos.com", so the
        drawer kept saying that while the header above it showed the real foro. */}
    <span className="mdl-layout-title newdreamers">
      {head?.Titulo || "gritos.com"}
    </span>
    {arriba}
    <ResumenNav />
    {children}
  </div>
);

Drawer.propTypes = {
  open: PropTypes.bool,
  head: PropTypes.shape({
    Titulo: PropTypes.string,
  }),
  arriba: PropTypes.node,
  children: PropTypes.node,
};

export default Drawer;
