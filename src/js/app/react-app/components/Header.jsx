import { Link, NavLink, useParams } from "react-router-dom";
import logo from "../../../../img/logo50x50.gif";
import normalizeForo from "../utils/normalizeForo";
import LoginStatus from "./LoginStatus";
import NotificacionesButton from "./NotificacionesButton";

const activeClass = ({ isActive }) =>
  isActive ? "mdl-navigation__link active" : "mdl-navigation__link";

const Header = () => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const rootPath = `/${currentForo}`;
  const title = currentForo === "foroscomun" ? "Gritos.com" : `#${currentForo}`;

  return (
    <header className="mdl-layout__header">
      <div className="mdl-layout-icon" />
      <div className="mdl-layout__header-row">
        <div className="js-home logomask pseudo mdl-layout--large-screen-only">
          <Link to={rootPath} title="home de gritos.com">
            <img src={logo} alt="Gritos.com" />
          </Link>
        </div>

        <div
          className="mdl-layout-title titulo mdl-layout--large-screen-only"
          title={title}
        >
          <Link to={rootPath}>{title}</Link>
        </div>

        <div
          className="mdl-layout-title titulo mdl-layout--small-screen-only"
          title={title}
        >
          <Link to={rootPath}>{title}</Link>
        </div>

        <nav className="mdl-navigation">
          <NavLink to={rootPath} className={activeClass} end>
            Foros
          </NavLink>
          <NavLink to={`${rootPath}/gallery`} className={activeClass}>
            Galería
          </NavLink>
          <NavLink to={`${rootPath}/votaciones`} className={activeClass}>
            Votaciones
          </NavLink>
          <NotificacionesButton />
          <LoginStatus />
        </nav>
      </div>
    </header>
  );
};

export default Header;
