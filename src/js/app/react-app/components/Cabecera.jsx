import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import LoginStatus from "./LoginStatus";
import NotificacionesButton from "./NotificacionesButton";
import PestanasForo from "./PestanasForo";
import TemaToggle from "./TemaToggle";

// La cabecera de gritos desde el rediseño de nov-2026 (sustituyo a Header.jsx y a las
// miniaturas de RightSidebar, retiradas en la fase 5).
// Misma familia que d26 (dreamers.es) con la identidad de gritos: verde bosque con
// trama de vineta, filete lima, la marca en Melody3 con la «g» en lima. La campana y
// la cuenta son los mismos componentes que en Header (misma logica y mismas clases,
// que es lo que miran las pruebas e2e); aqui solo cambia como se ven.
const Cabecera = ({
  head,
  currentForo,
  esMuro,
  base,
  isGallery,
  isVotaciones,
  drawerOpen,
  onMenuClick,
}) => {
  const navigate = useNavigate();
  const esPortada = currentForo === "foroscomun" && !esMuro;
  // igual que Header: el titulo lleva al foro; en foroscomun, a "/"
  const rootPath = esPortada ? "/" : `/${esMuro ? base : currentForo}`;
  const titulo = head?.Titulo || (esPortada ? "" : currentForo);

  const irAPortada = (event) => {
    event.preventDefault();
    navigate("/");
    window.scrollTo(0, 0);
  };

  return (
    <header className={`cab26${esMuro ? " cab26--muro" : ""}`}>
      <div className="cab26-fila">
        <button
          type="button"
          className="cab26-ico cab26-menu"
          onClick={onMenuClick}
          aria-label="Todos los foros"
          aria-expanded={drawerOpen}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link
          to="/"
          className="cab26-marca"
          onClick={irAPortada}
          aria-label="gritos.com, portada"
        >
          <b>g</b>
          <span>ritos</span>
        </Link>
        {esPortada ? (
          <p className="cab26-lema">Grita sin cortarte un pelo</p>
        ) : (
          <div className="cab26-foro">
            <small>{esMuro ? "Muro" : "Foro"}</small>
            <Link to={rootPath} title={titulo}>
              {titulo}
            </Link>
          </div>
        )}
        <div className="cab26-herr">
          <NotificacionesButton />
          <div className="login-view cab26-cuenta">
            <LoginStatus />
          </div>
          <TemaToggle />
        </div>
      </div>
      {!esPortada && (
        <PestanasForo
          base={base}
          esMuro={esMuro}
          isGallery={isGallery}
          isVotaciones={isVotaciones}
        />
      )}
    </header>
  );
};

Cabecera.propTypes = {
  head: PropTypes.shape({
    Titulo: PropTypes.string,
  }),
  currentForo: PropTypes.string.isRequired,
  esMuro: PropTypes.bool,
  base: PropTypes.string,
  isGallery: PropTypes.bool,
  isVotaciones: PropTypes.bool,
  drawerOpen: PropTypes.bool,
  onMenuClick: PropTypes.func.isRequired,
};

export default Cabecera;
