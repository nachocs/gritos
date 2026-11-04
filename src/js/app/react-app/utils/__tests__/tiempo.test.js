import { desde, desdeUnix } from "../tiempo";

// Lo que decia moment 2.30 («es») para cada caso: sacado de moment antes de quitarlo.
// Cubre los cortes (44/45 segundos, 45 minutos, 22 horas, 26 dias, 11 meses) y los meses
// de calendario (del 31 de enero al 1 de marzo, del 28 de febrero al 31 de marzo). Todo a
// mediodia para que no dependa de la zona horaria. La comparacion completa (749.784 casos,
// en Madrid y en Los Angeles) se hizo contra moment al cambiarlo: 0 diferencias.
// [ahora, fecha, sinSufijo, lo que decia moment]
const TABLA = [
  ["2026-11-04T12:00:00", "2026-11-04T11:59:30", true, "unos segundos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:59:30", false, "hace unos segundos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:59:16", true, "unos segundos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:59:16", false, "hace unos segundos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:59:15", true, "un minuto"],
  ["2026-11-04T12:00:00", "2026-11-04T11:59:15", false, "hace un minuto"],
  ["2026-11-04T12:00:00", "2026-11-04T11:58:00", true, "2 minutos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:58:00", false, "hace 2 minutos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:15:31", true, "44 minutos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:15:31", false, "hace 44 minutos"],
  ["2026-11-04T12:00:00", "2026-11-04T11:15:00", true, "una hora"],
  ["2026-11-04T12:00:00", "2026-11-04T11:15:00", false, "hace una hora"],
  ["2026-11-04T12:00:00", "2026-11-04T09:00:00", true, "3 horas"],
  ["2026-11-04T12:00:00", "2026-11-04T09:00:00", false, "hace 3 horas"],
  ["2026-11-04T12:00:00", "2026-11-03T14:30:00", true, "un día"],
  ["2026-11-04T12:00:00", "2026-11-03T14:30:00", false, "hace un día"],
  ["2026-11-04T12:00:00", "2026-11-03T12:00:00", true, "un día"],
  ["2026-11-04T12:00:00", "2026-11-03T12:00:00", false, "hace un día"],
  ["2026-11-04T12:00:00", "2026-10-10T12:00:00", true, "25 días"],
  ["2026-11-04T12:00:00", "2026-10-10T12:00:00", false, "hace 25 días"],
  ["2026-11-04T12:00:00", "2026-10-09T12:00:00", true, "un mes"],
  ["2026-11-04T12:00:00", "2026-10-09T12:00:00", false, "hace un mes"],
  ["2026-11-04T12:00:00", "2026-09-20T12:00:00", true, "un mes"],
  ["2026-11-04T12:00:00", "2026-09-20T12:00:00", false, "hace un mes"],
  ["2026-11-04T12:00:00", "2026-01-04T12:00:00", true, "10 meses"],
  ["2026-11-04T12:00:00", "2026-01-04T12:00:00", false, "hace 10 meses"],
  ["2026-11-04T12:00:00", "2025-12-20T12:00:00", true, "10 meses"],
  ["2026-11-04T12:00:00", "2025-12-20T12:00:00", false, "hace 10 meses"],
  ["2026-11-04T12:00:00", "2025-05-04T12:00:00", true, "2 años"],
  ["2026-11-04T12:00:00", "2025-05-04T12:00:00", false, "hace 2 años"],
  ["2026-11-04T12:00:00", "2024-05-04T12:00:00", true, "3 años"],
  ["2026-11-04T12:00:00", "2024-05-04T12:00:00", false, "hace 3 años"],
  ["2026-11-04T12:00:00", "2012-10-16T12:00:00", true, "14 años"],
  ["2026-11-04T12:00:00", "2012-10-16T12:00:00", false, "hace 14 años"],
  ["2026-03-31T12:00:00", "2026-02-28T12:00:00", true, "un mes"],
  ["2026-03-31T12:00:00", "2026-02-28T12:00:00", false, "hace un mes"],
  ["2026-03-01T12:00:00", "2026-01-31T12:00:00", true, "un mes"],
  ["2026-03-01T12:00:00", "2026-01-31T12:00:00", false, "hace un mes"],
  ["2026-11-04T12:00:00", "2026-11-04T15:00:00", true, "3 horas"],
  ["2026-11-04T12:00:00", "2026-11-04T15:00:00", false, "en 3 horas"],
  ["2026-11-04T12:00:00", "2027-03-04T12:00:00", true, "4 meses"],
  ["2026-11-04T12:00:00", "2027-03-04T12:00:00", false, "en 4 meses"],
];

describe("desde", () => {
  it.each(TABLA)(
    "%s / %s (sin sufijo: %s) -> %s",
    (ahora, fecha, sinSufijo, esperado) => {
      expect(
        desde(new Date(fecha), { ahora: new Date(ahora), sinSufijo }),
      ).toBe(esperado);
    },
  );

  it("fechas imposibles: null (moment daba invalida y la app no pintaba nada)", () => {
    expect(desde(new Date("Domingo, 13 de Junio de 2010"))).toBeNull();
    expect(desdeUnix("")).toBeNull();
    expect(desdeUnix("abc")).toBeNull();
  });

  it("desdeUnix: los segundos que manda la API", () => {
    const ahora = new Date("2026-11-04T12:00:00").getTime();
    expect(desdeUnix(ahora / 1000 - 5 * 3600, { ahora, sinSufijo: true })).toBe(
      "5 horas",
    );
  });
});
