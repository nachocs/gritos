import { pedirVistaPrevia } from "../captureUrl";

const respuesta = (estado, datos) => Promise.resolve({ status: estado, json: () => Promise.resolve(datos) });
afterEach(() => {
  delete global.fetch;
});

describe("pedirVistaPrevia (GET /avisos-api/preview)", () => {
  it("pide https primero, con la sesion como Bearer, y devuelve la vista previa", async () => {
    global.fetch = jest.fn(() => respuesta(200, { url: "https://example.org/", title: "Ejemplo", description: "d", image: "https://example.org/i.png" }));
    const r = await pedirVistaPrevia({ uid: "sesion", url: "example.org/a b" });
    expect(r.title).toBe("Ejemplo");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, op] = global.fetch.mock.calls[0];
    expect(url).toBe("/avisos-api/preview?url=https%3A%2F%2Fexample.org%2Fa%20b");
    expect(op.headers.Authorization).toBe("Bearer sesion");
  });

  it("si https no da nada (404/400/red) prueba http", async () => {
    global.fetch = jest.fn()
      .mockImplementationOnce(() => respuesta(404, { error: "sin_vista_previa" }))
      .mockImplementationOnce(() => respuesta(200, { url: "http://viejo.example/", title: "Viejo" }));
    expect((await pedirVistaPrevia({ uid: "s", url: "viejo.example" })).title).toBe("Viejo");
    expect(global.fetch.mock.calls[1][0]).toContain("http%3A%2F%2Fviejo.example");

    global.fetch = jest.fn().mockImplementationOnce(() => Promise.reject(new Error("red"))).mockImplementationOnce(() => respuesta(200, { title: "Despues de un fallo de red" }));
    expect((await pedirVistaPrevia({ uid: "s", url: "x.example" })).title).toBe("Despues de un fallo de red");
  });

  it("un limite (429) o una sesion caducada (401) no reintentan con http", async () => {
    for (const estado of [429, 401]) {
      global.fetch = jest.fn(() => respuesta(estado, {}));
      expect(await pedirVistaPrevia({ uid: "s", url: "x.example" })).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }
  });

  it("sin sesion o sin url no sale nada; nunca lanza; una respuesta vacia no es una vista previa", async () => {
    global.fetch = jest.fn();
    expect(await pedirVistaPrevia({ uid: "", url: "x.example" })).toBeNull();
    expect(await pedirVistaPrevia({ uid: "s", url: "" })).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    global.fetch = jest.fn(() => Promise.reject(new Error("sin red")));
    expect(await pedirVistaPrevia({ uid: "s", url: "x.example" })).toBeNull();
    global.fetch = jest.fn(() => respuesta(200, { url: "https://x.example/" }));
    expect(await pedirVistaPrevia({ uid: "s", url: "x.example" })).toBeNull();
  });
});
