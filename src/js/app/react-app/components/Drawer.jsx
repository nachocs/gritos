import PropTypes from "prop-types";
import ResumenNav from "./ResumenNav";

// `open` toggles MDL's `is-visible` class (the CDN MDL CSS handles the slide
// transform); the drawer is React-controlled since MDL's JS never upgrades it.
const Drawer = ({ open }) => (
  <div className={`mdl-layout__drawer${open ? " is-visible" : ""}`}>
    <span className="mdl-layout-title newdreamers">Gritos.com</span>
    <ResumenNav />
  </div>
);

Drawer.propTypes = {
  open: PropTypes.bool,
};

Drawer.defaultProps = {
  open: false,
};

export default Drawer;
