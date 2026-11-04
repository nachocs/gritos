import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";

// Carrusel de las imagenes de un grito (cuando trae 2 o mas). Sustituye a slick, que
// arrastraba jQuery solo para esto. Una fila con scroll-snap: en movil se pasa con el
// dedo; las flechas avanzan una vista entera y se apagan en los extremos, y un contador
// («1–3 de 7») hace de puntos. Como slick: 3 por vista (2 si son 2), 2 por debajo de
// 600px y 1 por debajo de 480px (bocadillos.less).
// El zoom no es cosa de este componente: las imagenes altas llevan `img-hover` y el clic
// lo recoge handleContentClick de MessageItem, como siempre.
const HUECO = 8; // el gap de la fila, en px (bocadillos.less)

const Carrusel = ({ images }) => {
  const pista = useRef(null);
  const [vista, setVista] = useState({ primera: 0, porVista: 1 });
  const total = images.length;

  const medir = useCallback(() => {
    const el = pista.current;
    const diapo = el?.firstElementChild;
    if (!el || !diapo) return;
    const paso = diapo.getBoundingClientRect().width + HUECO;
    if (!paso) return;
    setVista({
      primera: Math.round(el.scrollLeft / paso),
      porVista: Math.max(1, Math.round((el.clientWidth + HUECO) / paso)),
    });
  }, []);

  useEffect(() => {
    medir();
    if (typeof ResizeObserver === "undefined" || !pista.current) {
      return undefined;
    }
    const observador = new ResizeObserver(medir);
    observador.observe(pista.current);
    return () => observador.disconnect();
  }, [medir]);

  const mover = (direccion) => {
    const el = pista.current;
    el?.scrollBy?.({ left: direccion * (el.clientWidth + HUECO) });
  };

  const ultima = Math.min(vista.primera + vista.porVista, total);
  const caben = vista.porVista >= total;

  return (
    <div className={`images-place carrusel carrusel--${total >= 3 ? 3 : 2}`}>
      <div
        className="carrusel-pista"
        ref={pista}
        onScroll={medir}
        role="group"
        aria-label={`${total} imágenes`}
      >
        {images.map((image, i) => {
          // como el displayImage2 de siempre: zoom solo en las altas
          const zoom = (image.height || 0) > 364;
          return (
            <div className="carrusel-diapo" key={image.src + i}>
              <img
                src={image.src}
                alt={`imagen ${i + 1} de ${total}`}
                title={zoom ? "click para zoom" : ""}
                className={zoom ? "img-hover" : ""}
                loading={i < 3 ? "eager" : "lazy"}
              />
            </div>
          );
        })}
      </div>
      {!caben && (
        <>
          <button
            type="button"
            className="carrusel-flecha carrusel-anterior"
            onClick={() => mover(-1)}
            disabled={vista.primera <= 0}
            aria-label="Imágenes anteriores"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="carrusel-flecha carrusel-siguiente"
            onClick={() => mover(1)}
            disabled={ultima >= total}
            aria-label="Imágenes siguientes"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
          <p className="carrusel-cuenta" aria-live="polite">
            {vista.porVista > 1 ? `${vista.primera + 1}–${ultima}` : ultima} de{" "}
            {total}
          </p>
        </>
      )}
    </div>
  );
};

Carrusel.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  ).isRequired,
};

export default Carrusel;
