import useDiseno, { _reiniciarDiseno } from "../useDiseno";

// El diseño nuevo es el de todos; ?diseno=0 vuelve al de siempre y se queda
// guardado; ?diseno=26 deshace esa eleccion.
describe("useDiseno", () => {
  const visitar = (search) => {
    window.history.replaceState({}, "", `/comic${search}`);
    _reiniciarDiseno();
    return useDiseno();
  };

  beforeEach(() => window.localStorage.clear());

  it("sin nada, el diseño nuevo", () => {
    expect(visitar("")).toBe(true);
  });

  it("?diseno=0 vuelve al de siempre y se recuerda en la siguiente visita", () => {
    expect(visitar("?diseno=0")).toBe(false);
    expect(visitar("")).toBe(false);
  });

  it("?diseno=26 deshace la vuelta atras", () => {
    visitar("?diseno=0");
    expect(visitar("?diseno=26")).toBe(true);
    expect(visitar("")).toBe(true);
  });
});
