// Interruptor del diseño nuevo mientras se prueba en produccion (como /d26/ en dreamers.es):
// `?diseno=26` lo enciende y se queda guardado en este navegador; `?diseno=0` lo apaga.
// Sin nada guardado, la web sale con el diseño de siempre.
const CLAVE = "gritos-diseno";

const leerDiseno = () => {
  let guardado = null;
  try {
    const pedido = new URLSearchParams(window.location.search).get("diseno");
    if (pedido === "26") {
      window.localStorage.setItem(CLAVE, "26");
    } else if (pedido === "0") {
      window.localStorage.removeItem(CLAVE);
    }
    guardado = window.localStorage.getItem(CLAVE);
  } catch {
    // sin localStorage (navegacion privada, bloqueado): se decide solo por la URL
    return new URLSearchParams(window.location.search).get("diseno") === "26";
  }
  return guardado === "26";
};

// Se lee una vez al cargar: cambiar de diseño a mitad de visita no tiene sentido
// y asi no se repinta toda la cabecera en cada navegacion.
let diseno = null;
const useDiseno = () => {
  if (diseno === null) {
    diseno = typeof window !== "undefined" && leerDiseno();
  }
  return diseno;
};

// para las pruebas
export const _reiniciarDiseno = () => {
  diseno = null;
};

export default useDiseno;
