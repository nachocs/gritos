import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useUser } from "../hooks/useContexts";
import useJsonSearch from "../hooks/useJsonSearch";
import { abrirEdicionForo, canAdminForo } from "./ForoAdmin";

// La ficha del ciudadano encima de su muro, como la de dreamers.es (misma cuenta):
// numero de ciudadano, nivel con su nombre, desde cuando y puntos (head.cgi los manda
// desde gritos-api 474d274), enlace a su ficha en dreamers.es, sus ultimas imagenes y,
// para el dueño, «Edita tu muro» a la vista (antes solo era un engranaje). Nada de datos
// personales: en dreamers dependen de lo que cada uno marco como publico.

// los mismos nombres que la ficha de dreamers (d26/ciudadano.html)
const NIVELES = {
  1: "ciudadano activo",
  2: "ciudadano VIP",
  3: "ciudadano SUPER",
  4: "gobernador de su ciudad",
  5: "webmaster de su ciudad",
  6: "presidente de región",
  7: "controlador de región",
  8: "miembro de la redacción dreamers",
  9: "consejero de dreamers",
  10: "webmaster de dreamers",
};
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// «12-04-2001» -> «abril de 2001»
export const desdeCuando = (fecha) => {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(fecha || "").trim());
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return `${MESES[Number(m[2]) - 1]} de ${m[3]}`;
};

export const nombreNivel = (nivel) =>
  NIVELES[Number(nivel)] || "ciudadano dormido";

const miniatura = (entrada) =>
  entrada.IMAGEN0_THUMB || entrada.IMAGEN1_THUMB_URL || entrada.IMAGEN1_URL;

const FichaMuro = ({ head, id }) => {
  const { user } = useUser();
  const { data: entradas } = useJsonSearch({
    foro: `ciudadanos/${id}`,
    encontrar: "Ficheros",
    max: 6,
  });
  if (!head) return null;

  const alias = head.Titulo || `ciudadano ${id}`;
  const desde = desdeCuando(head.fecha_registro);
  const puntos = Number(head.puntos) || 0;
  const imagenes = (entradas || [])
    .map((e) => ({ src: miniatura(e), id: e.ID || e.wId }))
    .filter((i) => i.src && i.id);
  const esSuyo = String(user?.ID || "") === String(id);
  const puedeEditar = canAdminForo(head, user);

  return (
    <section className="ficha-muro" aria-label={`Ficha de ${alias}`}>
      <div className="ficha-muro-datos">
        <p className="ficha-muro-kicker">Ciudadano dreamers n.º {id}</p>
        <h2 className="ficha-muro-alias">{alias}</h2>
        <p className="ficha-muro-linea">
          <span className="ficha-muro-nivel">{nombreNivel(head.nivel)}</span>
          {desde && <span>desde {desde}</span>}
          {puntos > 0 && <span>{puntos.toLocaleString("es-ES")} puntos</span>}
        </p>
        <p className="ficha-muro-acciones">
          {puedeEditar && (
            <button
              type="button"
              className="ficha-muro-boton ficha-muro-boton--principal"
              onClick={() => abrirEdicionForo(head)}
            >
              {esSuyo ? "Edita tu muro" : "Editar este muro"}
            </button>
          )}
          <a
            className="ficha-muro-boton"
            href={`https://dreamers.es/ciudad/ciudadanos/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {esSuyo ? "Tu ficha en dreamers.es" : "Su ficha en dreamers.es"}
          </a>
        </p>
      </div>
      {imagenes.length > 0 && (
        <div className="ficha-muro-imagenes">
          <p className="ficha-muro-kicker">
            {esSuyo ? "Tus últimas imágenes" : "Sus últimas imágenes"}
          </p>
          <ul>
            {imagenes.map((img) => (
              <li key={img.id}>
                <Link to={`/ciudadanos/${id}/gallery`} tabIndex={-1}>
                  <img src={img.src} alt="" loading="lazy" />
                </Link>
              </li>
            ))}
          </ul>
          <Link className="ficha-muro-mas" to={`/ciudadanos/${id}/gallery`}>
            Ver toda su galería
          </Link>
        </div>
      )}
    </section>
  );
};

FichaMuro.propTypes = {
  head: PropTypes.shape({
    Titulo: PropTypes.string,
    nivel: PropTypes.string,
    puntos: PropTypes.string,
    fecha_registro: PropTypes.string,
  }),
  id: PropTypes.string.isRequired,
};

export default FichaMuro;
