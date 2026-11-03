import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import useJsonSearch from "../hooks/useJsonSearch";

// Gritos · Galería · Votaciones: sustituyen a las miniaturas de la barra lateral
// (RightSidebar), que en movil flotaban sobre la descripcion. Mismas consultas y
// mismas condiciones que GalleryThumbnail y VotacionesThumbnail: la pestaña sale
// si hay al menos una imagen o una encuesta con texto, y siempre la de la vista
// en la que se esta. `base` es el mismo foro que recibia RightSidebar.
const PestanasForo = ({ base, esMuro, isGallery, isVotaciones }) => {
  const { data: imagenes } = useJsonSearch({
    foro: base,
    encontrar: "Ficheros",
    max: 1,
  });
  const { data: encuestas } = useJsonSearch({
    foro: base,
    encontrar: "encuesta",
    max: 1,
  });
  const img = imagenes?.[0];
  const hayGaleria =
    isGallery ||
    Boolean(
      img && (img.IMAGEN0_THUMB || img.IMAGEN1_THUMB_URL || img.IMAGEN1_URL),
    );
  const hayVotaciones = isVotaciones || Boolean(encuestas?.[0]?.comments);

  const pestanas = [
    {
      clave: "gritos",
      texto: esMuro ? "Muro" : "Gritos",
      ruta: `/${base}`,
      activa: !isGallery && !isVotaciones,
    },
    hayGaleria && {
      clave: "galeria",
      texto: "Galería",
      ruta: `/${base}/gallery`,
      activa: isGallery,
    },
    hayVotaciones && {
      clave: "votaciones",
      texto: "Votaciones",
      ruta: `/${base}/votaciones`,
      activa: isVotaciones,
    },
  ].filter(Boolean);

  return (
    <nav className="cab26-pestanas" aria-label="Secciones del foro">
      {pestanas.map((p) => (
        <Link
          key={p.clave}
          to={p.ruta}
          className={`cab26-pestana${p.activa ? " on" : ""}`}
          aria-current={p.activa ? "page" : undefined}
        >
          {p.texto}
        </Link>
      ))}
    </nav>
  );
};

PestanasForo.propTypes = {
  base: PropTypes.string.isRequired,
  esMuro: PropTypes.bool,
  isGallery: PropTypes.bool,
  isVotaciones: PropTypes.bool,
};

export default PestanasForo;
