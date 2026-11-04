// «hace 5 horas», «un mes», «14 años»... Sustituye a moment.js, que solo se usaba para
// esto (fromNow con el idioma «es»). Mismos textos y mismos cortes que moment 2.30, y el
// mismo algoritmo: los meses se cuentan en el CALENDARIO (del 31 de enero al 28 de
// febrero es un mes) y el resto en milisegundos; luego cada unidad se redondea por su
// cuenta (relativeTime y Duration#as de moment). Comprobado contra moment para miles de
// intervalos antes de quitarlo (tiempo.test.js guarda una muestra).
const TEXTOS = {
  s: "unos segundos",
  ss: "%d segundos",
  m: "un minuto",
  mm: "%d minutos",
  h: "una hora",
  hh: "%d horas",
  d: "un día",
  dd: "%d días",
  M: "un mes",
  MM: "%d meses",
  y: "un año",
  yy: "%d años",
};
// moment: ss 44, s 45, m 45, h 22, d 26, M 11 (sin semanas)
const CORTE = { ss: 44, s: 45, m: 45, h: 22, d: 26, M: 11 };

const diasDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();

// moment#add(n, 'M'): mismo dia del mes, o el ultimo si ese mes es mas corto
const sumarMeses = (fecha, meses) => {
  const d = new Date(fecha.getTime());
  const destino = d.getMonth() + meses;
  const anio = d.getFullYear() + Math.floor(destino / 12);
  const mes = ((destino % 12) + 12) % 12;
  d.setFullYear(anio, mes, Math.min(fecha.getDate(), diasDelMes(anio, mes)));
  return d;
};

// moment: positiveMomentsDifference (base <= otra)
const diferencia = (base, otra) => {
  let meses =
    otra.getMonth() -
    base.getMonth() +
    (otra.getFullYear() - base.getFullYear()) * 12;
  if (sumarMeses(base, meses) > otra) meses -= 1;
  return { meses, ms: otra - sumarMeses(base, meses) };
};

const aFecha = (valor) => {
  if (valor instanceof Date) return valor;
  if (typeof valor === "number") return new Date(valor);
  return null;
};

// `fecha` y `ahora`: Date o milisegundos. `sinSufijo`: «5 horas» en vez de «hace 5 horas».
export const desde = (
  fecha,
  { ahora = Date.now(), sinSufijo = false } = {},
) => {
  const a = aFecha(fecha);
  const b = aFecha(ahora);
  if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return null;
  }
  const pasado = a <= b;
  const { meses, ms } = pasado ? diferencia(a, b) : diferencia(b, a);
  // Duration#as: los dias de los meses se redondean a dias enteros para s/m/h/d;
  // para meses y años, los milisegundos pasan a meses con 400 años = 146097 dias
  const diasDeMeses = Math.round((meses * 146097) / 4800);
  const segundos = Math.round(diasDeMeses * 86400 + ms / 1000);
  const minutos = Math.round(diasDeMeses * 1440 + ms / 6e4);
  const horas = Math.round(diasDeMeses * 24 + ms / 36e5);
  const dias = Math.round(diasDeMeses + ms / 864e5);
  const mesesTot = meses + ((ms / 864e5) * 4800) / 146097;
  const mesesR = Math.round(mesesTot);
  const anios = Math.round(mesesTot / 12);

  const [clave, n] = (segundos <= CORTE.ss && ["s", segundos]) ||
    (segundos < CORTE.s && ["ss", segundos]) ||
    (minutos <= 1 && ["m"]) ||
    (minutos < CORTE.m && ["mm", minutos]) ||
    (horas <= 1 && ["h"]) ||
    (horas < CORTE.h && ["hh", horas]) ||
    (dias <= 1 && ["d"]) ||
    (dias < CORTE.d && ["dd", dias]) ||
    (mesesR <= 1 && ["M"]) ||
    (mesesR < CORTE.M && ["MM", mesesR]) ||
    (anios <= 1 && ["y"]) || ["yy", anios];
  const texto = TEXTOS[clave].replace("%d", n);
  if (sinSufijo) return texto;
  return pasado ? `hace ${texto}` : `en ${texto}`;
};

// segundos Unix (como vienen FECHA y `actualizada` de la API) -> «5 horas»/«hace 5 horas»
export const desdeUnix = (segundos, opciones) => {
  const n = Number(segundos);
  return Number.isFinite(n) && n > 0 ? desde(n * 1000, opciones) : null;
};

// segundos Unix -> «abril de 2016» (para «lleva callado desde…»)
export const mesYAnioUnix = (segundos) => {
  const n = Number(segundos);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
};
