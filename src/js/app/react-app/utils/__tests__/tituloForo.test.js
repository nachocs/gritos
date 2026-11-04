import tituloForo from "../tituloForo";

// 115 foros tienen «gritos.com» de titulo (temas creados sin nombre): se muestra su nombre.
describe("tituloForo", () => {
  it("el titulo si lo tiene, con las entidades decodificadas", () => {
    expect(tituloForo("Comic a Gritos", "comic")).toBe("Comic a Gritos");
    expect(tituloForo("&iquest;Ser&aacute; amor?", "amor")).toBe("¿Será amor?");
  });

  it("«gritos.com» o vacio: el nombre de la URL, sin guiones bajos", () => {
    expect(tituloForo("gritos.com", "Crisis_existencial_")).toBe(
      "Crisis existencial",
    );
    expect(tituloForo("GRITOS.COM ", "Desahogate")).toBe("Desahogate");
    expect(tituloForo("", "Sin_trabajo_")).toBe("Sin trabajo");
    expect(tituloForo(undefined, "")).toBe("");
  });
});
