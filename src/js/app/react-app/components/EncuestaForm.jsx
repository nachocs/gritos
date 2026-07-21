import { encode } from "html-entities";
import PropTypes from "prop-types";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

/**
 * Poll (encuesta) creation UI. Port of legacy main/encuestas/encuestasForm.js:
 * a growing list of option inputs — Enter on the last option adds another and
 * focuses it, each option has a delete control. The host reads the result via
 * the imperative getEncuesta(), which mirrors legacy submit serialization:
 * values html-entity encoded, empty options dropped, JSON-stringified, or null
 * when there is nothing to ask.
 */
const EncuestaForm = forwardRef(function EncuestaForm(_props, ref) {
  const [options, setOptions] = useState([{ id: 1, value: "" }]);
  const inputsRef = useRef({});

  useImperativeHandle(ref, () => ({
    getEncuesta() {
      const filled = options
        .filter((option) => option.value.trim())
        .map((option) => ({
          id: option.id,
          value: encode(option.value, { mode: "extensive" }),
        }));
      if (filled.length === 0) {
        return null;
      }
      return JSON.stringify({ options: filled });
    },
    reset() {
      setOptions([{ id: 1, value: "" }]);
    },
  }));

  const setValue = (id, value) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, value } : option)),
    );
  };

  const removeOption = (id) => {
    setOptions((prev) => prev.filter((option) => option.id !== id));
  };

  const handleKeyDown = (event, option) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const lastId = options[options.length - 1].id;
    if (option.id === lastId) {
      const newId = lastId + 1;
      setOptions((prev) => [...prev, { id: newId, value: "" }]);
      // Focus the freshly added input after it mounts.
      requestAnimationFrame(() => inputsRef.current[newId]?.focus());
    } else {
      inputsRef.current[option.id + 1]?.focus();
    }
  };

  return (
    <div className="encuestas-form">
      <span className="encuesta-header">Votación</span>
      {options.map((option) => (
        <div key={option.id} style={{ position: "relative" }}>
          <input
            type="text"
            name={String(option.id)}
            ref={(el) => {
              inputsRef.current[option.id] = el;
            }}
            placeholder={`opción ${option.id}`}
            value={option.value}
            onChange={(event) => setValue(option.id, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, option)}
          />
          <div
            className="encuesta-cierra-opcion"
            role="button"
            tabIndex={0}
            title="borrar esta opción"
            onClick={() => removeOption(option.id)}
            onKeyDown={(event) =>
              event.key === "Enter" && removeOption(option.id)
            }
          >
            <i className="fa fa-times-circle-o" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
});

EncuestaForm.propTypes = {};

export default EncuestaForm;
