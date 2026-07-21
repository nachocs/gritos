import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import logo from "../../../../img/logo50x50.gif";
import normalizeForo from "../utils/normalizeForo";
import LoginStatus from "./LoginStatus";
import NotificacionesButton from "./NotificacionesButton";

// Matches the deployed header (master `mainView-t.html`): a fixed MDL header
// whose only nav affordances are notificaciones + login. Foro browsing lives
// in the slide-out drawer (the "TOP" resumen list); gallery/votaciones are
// reached from the right sidebar's thumbnails — neither is a header nav item.
// The invented "Foros / Galería / Votaciones" links that used to live here
// had no counterpart in the deployed app and duplicated the drawer/sidebar.
// MDL's own JS never upgrades React-rendered DOM (it scans on DOMContentLoaded,
// before React mounts), so the drawer toggle is React-controlled via
// onMenuClick rather than MDL's auto-injected drawer button.
const Header = ({ head, onMenuClick }) => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const rootPath = `/${currentForo}`;
  // Deployed title logic (mainView-t.html): the large-screen title bar shows
  // the head's `Titulo` verbatim ("king Crimson", and "gritos.com" on
  // foroscomun since that's DEFAULT_HEAD.Titulo); the small-screen one shows
  // the wall's Titulo on ciudadanos, else "#<name>" (or "gritos.com" at root).
  const largeTitle = head?.Titulo || "gritos.com";
  const smallTitle =
    head?.INDICE === "ciudadanos"
      ? head?.Titulo || "gritos.com"
      : currentForo !== "foroscomun"
        ? `#${currentForo}`
        : "gritos.com";

  return (
    <header
      className={`mdl-layout__header${
        head?.INDICE === "ciudadanos" ? " ciudadano" : ""
      }`}
    >
      <div
        className="mdl-layout__drawer-button"
        role="button"
        tabIndex={0}
        aria-label="Abrir menú"
        onClick={onMenuClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onMenuClick()}
      >
        <i className="material-icons">menu</i>
      </div>
      <div className="mdl-layout__header-row">
        <div className="js-home logomask pseudo mdl-layout--large-screen-only">
          <Link to={rootPath} title="home de gritos.com">
            <img src={logo} alt="Gritos.com" />
          </Link>
        </div>

        <div
          className="mdl-layout-title titulo mdl-layout--large-screen-only"
          title={largeTitle}
        >
          <Link to={rootPath}>{largeTitle}</Link>
        </div>

        <div
          className="mdl-layout-title titulo mdl-layout--small-screen-only"
          title={smallTitle}
        >
          <Link to={rootPath}>{smallTitle}</Link>
        </div>

        <nav className="mdl-navigation">
          <NotificacionesButton />
          <LoginStatus />
        </nav>
      </div>
    </header>
  );
};

Header.propTypes = {
  head: PropTypes.shape({
    Titulo: PropTypes.string,
    INDICE: PropTypes.string,
  }),
  onMenuClick: PropTypes.func.isRequired,
};

export default Header;
