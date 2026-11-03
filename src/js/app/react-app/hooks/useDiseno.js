// Interruptor del diseño nuevo. Desde el 3-nov-2026 el nuevo es el de todos;
// `?diseno=0` vuelve a la cabecera de siempre en este navegador (se queda guardado)
// y `?diseno=26` deshace esa eleccion. Es la salida rapida mientras el diseño viejo
// siga en el codigo; cuando se retire Header.jsx, esto se borra.
const CLAVE = "gritos-diseno";

const leerDiseno = () => {
  let guardado = null;
  try {
    const pedido = new URLSearchParams(window.location.search).get("diseno");
    if (pedido === "0") {
      window.localStorage.setItem(CLAVE, "0");
    } else if (pedido === "26") {
      window.localStorage.removeItem(CLAVE);
    }
    guardado = window.localStorage.getItem(CLAVE);
  } catch {
    // sin localStorage (navegacion privada, bloqueado): se decide solo por la URL
    return new URLSearchParams(window.location.search).get("diseno") !== "0";
  }
  return guardado !== "0";
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
