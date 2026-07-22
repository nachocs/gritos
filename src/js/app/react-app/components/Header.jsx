import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  // Legacy's data-link="/<%= obj.Name !== 'foroscomun' ? obj.Name : '' %>":
  // the title points at "/" on the default forum, not "/foroscomun".
  const rootPath = currentForo === "foroscomun" ? "/" : `/${currentForo}`;
  const navigate = useNavigate();

  const goHome = (event) => {
    event.preventDefault();
    navigate("/");
    window.scrollTo(0, 0);
  };

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
          <Link to="/" title="home de gritos.com" onClick={goHome}>
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
          {/* Legacy mainView-t.html renders `<div class="mdl-navigation__link
              login-view">` and injects loginView's element into it. The whole
              `.login-view { ... }` block in main.less (the 48px dreamy, the
              335px `ul.login-menu` panel, `.sign-up`, `.error-login`,
              `.fb-login`) is scoped under that class, so it has to be the
              wrapper here rather than a class on the button. */}
          <div className="mdl-navigation__link login-view">
            <LoginStatus />
          </div>
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
