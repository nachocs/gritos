import { useEffect, useState } from "react";
import endpoints from "../../util/endpoints";
import { fetchJson } from "../utils/apiFetch";
import tituloForo from "../utils/tituloForo";

// La lista de foros (foros.cgi: [{ name, titulo }]) para el buscador. Se pide una vez
// por visita, la primera vez que alguien abre el buscador, y se guarda aqui: la abren
// la cabecera y el cajon y no tiene sentido pedirla dos veces. Los titulos llegan con
// entidades HTML («Ser&aacute;»): se decodifican y se prepara una version sin tildes
// ni mayusculas para comparar.
let promesa = null;

export const normalizar = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const pedirForos = () => {
  if (!promesa) {
    promesa = fetchJson(`${endpoints.apiUrl}foros.cgi`)
      .then((datos) =>
        (Array.isArray(datos) ? datos : [])
          .filter((f) => f && /^\w+$/.test(f.name || ""))
          .map((f) => {
            const titulo = tituloForo(f.titulo, f.name);
            return {
              name: f.name,
              titulo,
              clave: `${normalizar(titulo)} ${normalizar(f.name)}`,
            };
          }),
      )
      .catch((error) => {
        promesa = null; // que se pueda reintentar en la siguiente apertura
        throw error;
      });
  }
  return promesa;
};

// para las pruebas
export const _reiniciarForos = () => {
  promesa = null;
};

// `activo`: hasta que alguien entra en el campo no se pide nada (el cajon esta siempre
// montado, aunque fuera de la pantalla, y si no se pediria en cada carga de pagina).
const useForos = (activo = true) => {
  const [estado, setEstado] = useState({
    foros: [],
    cargando: true,
    error: false,
  });
  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    pedirForos()
      .then(
        (foros) => vivo && setEstado({ foros, cargando: false, error: false }),
      )
      .catch(
        () => vivo && setEstado({ foros: [], cargando: false, error: true }),
      );
    return () => {
      vivo = false;
    };
  }, [activo]);
  return estado;
};

// Los que empiezan por lo escrito (en el titulo o en el nombre) van primero; luego los
// que lo contienen. Como mucho `max`.
export const buscarForos = (foros, consulta, max = 8) => {
  const q = normalizar(consulta);
  if (!q) return [];
  const empiezan = [];
  const contienen = [];
  for (const foro of foros) {
    const i = foro.clave.indexOf(q);
    if (i < 0) continue;
    const alPrincipio = i === 0 || foro.clave.includes(` ${q}`);
    (alPrincipio ? empiezan : contienen).push(foro);
    if (empiezan.length >= max) break;
  }
  return [...empiezan, ...contienen].slice(0, max);
};

export default useForos;
