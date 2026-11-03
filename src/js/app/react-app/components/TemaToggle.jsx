import { useEffect, useState } from "react";

// Claro/oscuro. Por defecto sigue al sistema (tema.less, prefers-color-scheme);
// al pulsar se fija lo contrario de lo que se ve y se guarda en este navegador.
// index.html lo vuelve a poner antes de pintar, para que no parpadee al cargar.
const CLAVE = "gritos-tema";

const temaDelSistema = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const temaVisible = () =>
  document.documentElement.getAttribute("data-theme") || temaDelSistema();

const TemaToggle = () => {
  const [tema, setTema] = useState(() => temaVisible());

  // si cambia el del sistema y no se ha fijado ninguno, el boton lo sigue
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return undefined;
    const sync = () => setTema(temaVisible());
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const alternar = () => {
    const nuevo = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    try {
      window.localStorage.setItem(CLAVE, nuevo);
    } catch {
      // sin localStorage dura hasta recargar
    }
    setTema(nuevo);
  };

  const oscuro = tema === "dark";
  return (
    <button
      type="button"
      className="cab26-ico cab26-tema"
      onClick={alternar}
      aria-pressed={oscuro}
      aria-label={oscuro ? "Cambiar al tema claro" : "Cambiar al tema oscuro"}
      title={oscuro ? "Tema claro" : "Tema oscuro"}
    >
      {oscuro ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
};

export default TemaToggle;
