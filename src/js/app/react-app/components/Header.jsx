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
  // The title links to the *current* head, as legacy's `data-link` does:
  // `/<Name>`, or `/` on foroscomun. It reads `Name` off the head rather than
  // the URL, so it still resolves on a ciudadanos wall — where the route is
  // `/ciudadanos/:id` and there is no `:foro` param to fall back on.
  const titleName = head?.Name || currentForo;
  const titlePath = titleName && titleName !== "foroscomun" ? `/${titleName}` : "/";

  // Legacy `mainView.goToHome` (mainView.js:104-107): the logo goes to the site
  // root and scrolls to top — it is the only "home" affordance in the header.
  // It used to link to `/<current foro>`, so clicking it on any foro other than
  // foroscomun just reloaded the page you were already on and never went home.
  // The scroll is explicit here as it is in legacy, rather than left to
  // ScrollToTop: clicking home *from* the home foro round-trips
  // `/` → `<Navigate>` → `/foroscomun` and ends on the pathname it started on.
  const goHome = () => window.scrollTo(0, 0);
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
          <Link to="/" title="home de gritos.com" onClick={goHome}>
            <img src={logo} alt="Gritos.com" />
          </Link>
        </div>

        <div
          className="mdl-layout-title titulo mdl-layout--large-screen-only"
          title={largeTitle}
        >
          <Link to={titlePath}>{largeTitle}</Link>
        </div>

        <div
          className="mdl-layout-title titulo mdl-layout--small-screen-only"
          title={smallTitle}
        >
          <Link to={titlePath}>{smallTitle}</Link>
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
    Name: PropTypes.string,
  }),
  onMenuClick: PropTypes.func.isRequired,
};

export default Header;
