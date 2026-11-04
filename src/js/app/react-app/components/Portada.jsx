import { Link } from "react-router-dom";
import useForos from "../hooks/useForos";
import useResumen from "../hooks/useResumen";
import tituloForo from "../utils/tituloForo";
import BuscadorForos from "./BuscadorForos";

// Lo de arriba de la portada (/): el buscador a la vista, los foros con movimiento
// (resumen.cgi: los ultimos con gritos) y los de siempre. Debajo sigue la lista del foro
// comun, como siempre. Los titulos salen de la lista de foros (foros.cgi): resumen.cgi
// solo trae el nombre.
const DE_SIEMPRE = [
  { name: "comic", titulo: "Comic a Gritos" },
  { name: "manga", titulo: "Manga a Gritos" },
  { name: "cine", titulo: "Cine a Gritos" },
  { name: "tv", titulo: "TV a Gritos" },
  { name: "videojuegos", titulo: "Videojuegos a Gritos" },
  { name: "libros", titulo: "Libros a Gritos" },
  { name: "musica", titulo: "Chirridos!" },
];

const nombreCorto = (n) =>
  String(n || "")
    .replace(/^gritos\//, "")
    .replace(/^foros\//, "");

const Portada = () => {
  const { data: resumen } = useResumen();
  const { foros } = useForos();
  const tituloDe = Object.fromEntries(foros.map((f) => [f.name, f.titulo]));
  const conMovimiento = (resumen || [])
    .map((r) => nombreCorto(r.name || r.value))
    .filter((n) => /^\w+$/.test(n))
    .map((name) => ({ name, titulo: tituloDe[name] || tituloForo("", name) }));

  return (
    <section className="portada" aria-label="Foros de gritos.com">
      <BuscadorForos variante="portada" />
      {conMovimiento.length > 0 && (
        <div className="portada-bloque">
          <h2 className="portada-titulo">Con movimiento</h2>
          <ul className="portada-foros">
            {conMovimiento.map((f) => (
              <li key={f.name}>
                <Link to={`/${f.name}`}>{f.titulo}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="portada-bloque">
        <h2 className="portada-titulo">Los de siempre</h2>
        <ul className="portada-foros">
          {DE_SIEMPRE.map((f) => (
            <li key={f.name}>
              <Link to={`/${f.name}`}>{f.titulo}</Link>
            </li>
          ))}
        </ul>
      </div>
      <h2 className="portada-titulo portada-titulo--lista">
        Lo último en el foro común
      </h2>
    </section>
  );
};

export default Portada;
