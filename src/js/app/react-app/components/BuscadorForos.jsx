import PropTypes from "prop-types";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useForos, { buscarForos } from "../hooks/useForos";

// Buscador de foros: un campo con la lista de resultados debajo (patron combobox de
// ARIA: flechas para moverse, Intro para ir, Escape para cerrar). Lo usan la cabecera
// (en un panel que se abre con la lupa) y el cajon de foros. Los datos, de useForos.
const BuscadorForos = ({ variante = "cajon", autoFocus = false, onElegir }) => {
  const [usado, setUsado] = useState(autoFocus);
  const { foros, cargando, error } = useForos(usado);
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);
  const navigate = useNavigate();
  const campo = useRef(null);
  const id = useId();
  const resultados = buscarForos(foros, consulta);
  const hayConsulta = consulta.trim() !== "";

  useEffect(() => {
    if (autoFocus) campo.current?.focus();
  }, [autoFocus]);
  useEffect(() => setActivo(0), [consulta]);

  const ir = (foro) => {
    navigate(`/${foro.name}`);
    setConsulta("");
    onElegir?.();
  };

  const alPulsar = (e) => {
    if (e.key === "ArrowDown" && resultados.length) {
      e.preventDefault();
      setActivo((a) => (a + 1) % resultados.length);
    } else if (e.key === "ArrowUp" && resultados.length) {
      e.preventDefault();
      setActivo((a) => (a - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter" && resultados[activo]) {
      e.preventDefault();
      ir(resultados[activo]);
    } else if (e.key === "Escape") {
      if (consulta) {
        setConsulta("");
      } else {
        onElegir?.();
      }
    }
  };

  return (
    <div className={`buscador buscador--${variante}`} role="search">
      <label className="buscador-etiqueta" htmlFor={`${id}-campo`}>
        Buscar un foro
      </label>
      <input
        ref={campo}
        id={`${id}-campo`}
        className="buscador-campo"
        type="search"
        autoComplete="off"
        placeholder="Cómic, cine, rol…"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        onKeyDown={alPulsar}
        onFocus={() => setUsado(true)}
        role="combobox"
        aria-expanded={hayConsulta && resultados.length > 0}
        aria-controls={`${id}-lista`}
        aria-activedescendant={
          resultados[activo] ? `${id}-${resultados[activo].name}` : undefined
        }
      />
      {hayConsulta && (
        <ul className="buscador-lista" id={`${id}-lista`} role="listbox">
          {resultados.map((foro, i) => (
            <li
              key={foro.name}
              id={`${id}-${foro.name}`}
              role="option"
              aria-selected={i === activo}
              className={`buscador-resultado${i === activo ? " on" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => ir(foro)}
              onMouseEnter={() => setActivo(i)}
            >
              <b>{foro.titulo}</b>
              <span>/{foro.name}</span>
            </li>
          ))}
          {!resultados.length && (
            <li className="buscador-nada" role="presentation">
              {cargando
                ? "Cargando foros…"
                : error
                  ? "No se ha podido cargar la lista de foros."
                  : "¡Silencio! Ningún foro se llama así."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

BuscadorForos.propTypes = {
  variante: PropTypes.oneOf(["cabecera", "cajon"]),
  autoFocus: PropTypes.bool,
  onElegir: PropTypes.func,
};

export default BuscadorForos;
