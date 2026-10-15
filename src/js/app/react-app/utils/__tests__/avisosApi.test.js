import { avisosFetch, claveForo, destinoDeAviso } from "../avisosApi";

describe("destinoDeAviso", () => {
  it("los avisos de gritos.com navegan dentro de la app", () => {
    expect(destinoDeAviso("https://gritos.com/kingcrimson/55")).toEqual({ interno: true, ruta: "/kingcrimson/55" });
    expect(destinoDeAviso("https://gritos.com")).toEqual({ interno: true, ruta: "/" });
    expect(destinoDeAviso("https://gritos.com/ciudadanos/5726")).toEqual({ interno: true, ruta: "/ciudadanos/5726" });
  });
  it("las rutas de dreamers.es se abren en dreamers.es", () => {
    expect(destinoDeAviso("/articulos/970#g5")).toEqual({ interno: false, ruta: "https://dreamers.es/articulos/970#g5" });
  });
  it("descarta lo que no es de confianza", () => {
    for (const malo of ["javascript:alert(1)", "//evil.example/x", "https://evil.example/x", "https://gritos.com.evil.example/x", "http://gritos.com/x", "data:text/html,x", "", null, undefined, 5]) {
      expect(destinoDeAviso(malo)).toBeNull();
    }
  });
});

describe("claveForo", () => {
  it("foroscomun, un foro y un muro", () => {
    expect(claveForo({})).toBe("foroscomun");
    expect(claveForo({ foro: "foroscomun" })).toBe("foroscomun");
    expect(claveForo({ foro: "kingcrimson" })).toBe("gritos/kingcrimson");
    expect(claveForo({ foro: "kingcrimson", id: "55" })).toBe("gritos/kingcrimson");
    expect(claveForo({ id: "5726" })).toBe("ciudadanos/5726");
  });
  it("rechaza nombres raros", () => {
    expect(claveForo({ foro: "a b" })).toBeNull();
    expect(claveForo({ foro: "../x" })).toBeNull();
    expect(claveForo({ id: "abc" })).toBeNull();
    expect(claveForo({ id: "0" })).toBeNull();
  });
});

describe("avisosFetch", () => {
  afterEach(() => {
    delete global.fetch;
  });
  it("manda la sesion como Bearer y el cuerpo como JSON, y devuelve estado y datos aunque sea un 4xx", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 409, json: () => Promise.resolve({ error: "demasiados" }) });
    const r = await avisosFetch("seguir", { uid: "abc", metodo: "POST", cuerpo: { clase: "foro" } });
    expect(r).toEqual({ estado: 409, datos: { error: "demasiados" } });
    const [url, op] = global.fetch.mock.calls[0];
    expect(url).toBe("/avisos-api/seguir");
    expect(op.method).toBe("POST");
    expect(op.headers.Authorization).toBe("Bearer abc");
    expect(op.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(op.body)).toEqual({ clase: "foro" });
  });
  it("sin sesion no manda Authorization; una respuesta que no es JSON da datos null", async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 502, json: () => Promise.reject(new Error("no json")) });
    const r = await avisosFetch("contador");
    expect(r).toEqual({ estado: 502, datos: null });
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});
