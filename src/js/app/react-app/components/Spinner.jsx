import { useEffect, useRef } from "react";

// MDL's spinner CSS animates four layer divs that componentHandler injects on
// upgrade, but (like MdlTextfield) MDL's JS never scans React-rendered DOM —
// it only runs once on DOMContentLoaded, before React mounts. Legacy's
// spinnerView.js worked around this the same way: call
// componentHandler.upgradeElement() manually on the raw
// `.mdl-spinner.mdl-js-spinner` markup once it exists in the DOM.
const Spinner = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && window.componentHandler) {
      window.componentHandler.upgradeElement(ref.current);
    }
  }, []);

  return (
    <div className="spinner-main">
      <div
        ref={ref}
        className="mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active"
      />
    </div>
  );
};

export default Spinner;
