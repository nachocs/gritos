import { decode } from "html-entities";

// El titulo con el que se muestra un foro. 115 de los ~470 foros tienen de titulo
// «gritos.com» (el que quedaba al crear un tema sin ponerle nombre): para esos, y para
// los que no tienen, se usa el nombre de la URL con los guiones bajos como espacios
// («Crisis_existencial_» -> «Crisis existencial»). Los titulos llegan con entidades.
export const tituloForo = (titulo, nombre) => {
  const limpio = decode(String(titulo || "")).trim();
  if (limpio && limpio.toLowerCase() !== "gritos.com") return limpio;
  const deNombre = String(nombre || "")
    .replace(/_+/g, " ")
    .trim();
  return deNombre || limpio;
};

export default tituloForo;
