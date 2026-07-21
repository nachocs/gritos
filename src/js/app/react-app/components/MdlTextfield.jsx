import PropTypes from "prop-types";
import { useState } from "react";

// MDL's floating label is pure CSS keyed off `is-focused`/`is-dirty` classes on
// the wrapper:
//   .mdl-textfield--floating-label.is-focused .mdl-textfield__label,
//   .mdl-textfield--floating-label.is-dirty   .mdl-textfield__label { top:4px; font-size:12px }
// MDL's own JS adds those classes, but it never upgrades React-rendered DOM (it
// scans once on DOMContentLoaded, before React mounts). Without them the label
// stays parked at its resting position on top of whatever the user types.
// Reproducing the two classes in React is the whole of the behaviour.
const MdlTextfield = ({ id, label, type, value, onChange, disabled }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`mdl-textfield mdl-js-textfield mdl-textfield--floating-label${
        focused ? " is-focused" : ""
      }${value ? " is-dirty" : ""}`}
    >
      <input
        className="mdl-textfield__input"
        type={type}
        id={id}
        value={value}
        disabled={disabled}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <label className="mdl-textfield__label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
};

MdlTextfield.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

MdlTextfield.defaultProps = {
  type: "text",
  disabled: false,
};

export default MdlTextfield;
