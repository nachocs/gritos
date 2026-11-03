import useDiseno, { _reiniciarDiseno } from "../useDiseno";

// ?diseno=26 enciende el diseño nuevo y se queda guardado; ?diseno=0 lo apaga.
describe("useDiseno", () => {
  const visitar = (search) => {
    window.history.replaceState({}, "", `/comic${search}`);
    _reiniciarDiseno();
    return useDiseno();
  };

  beforeEach(() => window.localStorage.clear());

  it("sin nada, el diseño de siempre", () => {
    expect(visitar("")).toBe(false);
  });

  it("?diseno=26 lo enciende y se recuerda en la siguiente visita", () => {
    expect(visitar("?diseno=26")).toBe(true);
    expect(visitar("")).toBe(true);
  });

  it("?diseno=0 lo apaga", () => {
    visitar("?diseno=26");
    expect(visitar("?diseno=0")).toBe(false);
    expect(visitar("")).toBe(false);
  });
});
