import { conexionesAbiertas, escucharSala, parseRoom } from "../salasEnVivo";

class FakeEventSource {
  static instancias = [];
  constructor(url) {
    this.url = url;
    this.oyentes = {};
    this.readyState = 1;
    FakeEventSource.instancias.push(this);
  }
  addEventListener(n, f) {
    this.oyentes[n] = f;
  }
  close() {
    this.readyState = 2;
    this.cerrado = true;
  }
  emitir(datos) {
    this.oyentes.sala({ data: typeof datos === "string" ? datos : JSON.stringify(datos) });
  }
}

beforeEach(() => {
  FakeEventSource.instancias = [];
  global.EventSource = FakeEventSource;
});
afterEach(() => {
  delete global.EventSource;
});

describe("parseRoom", () => {
  it("la lista de un foro, de foroscomun y de un muro", () => {
    expect(parseRoom("collection:kingcrimson")).toEqual({ sala: "gritos/kingcrimson", hilo: null });
    expect(parseRoom("kingcrimson")).toEqual({ sala: "gritos/kingcrimson", hilo: null });
    expect(parseRoom("collection:gritos/kingcrimson")).toEqual({ sala: "gritos/kingcrimson", hilo: null });
    expect(parseRoom("collection:foroscomun")).toEqual({ sala: "foroscomun", hilo: null });
    expect(parseRoom("collection:ciudadanos/5726/")).toEqual({ sala: "ciudadanos/5726", hilo: null });
  });
  it("un hilo escucha la sala de su foro y filtra por su indice", () => {
    expect(parseRoom("collection:gritos/kingcrimson/38631")).toEqual({ sala: "gritos/kingcrimson", hilo: "gritos/kingcrimson/38631" });
    expect(parseRoom("collection:ciudadanos/5726/12")).toEqual({ sala: "ciudadanos/5726", hilo: "ciudadanos/5726/12" });
    expect(parseRoom("collection:gritos/foroscomun/7")).toEqual({ sala: "foroscomun", hilo: "gritos/foroscomun/7" });
  });
  it("rechaza lo que no es una sala", () => {
    for (const malo of [null, undefined, "", 5, "a b", "../x", "gritos/", "a/b/c/d", "kingcrimson;x"]) {
      expect(parseRoom(malo)).toBeNull();
    }
  });
});

describe("escucharSala", () => {
  it("abre UNA conexion por sala, compartida, y la cierra al irse el ultimo", () => {
    const a = jest.fn();
    const b = jest.fn();
    const quitarA = escucharSala("gritos/kingcrimson", a);
    const quitarB = escucharSala("gritos/kingcrimson", b);
    expect(FakeEventSource.instancias).toHaveLength(1);
    expect(FakeEventSource.instancias[0].url).toBe("/avisos-api/sala/stream?sala=gritos%2Fkingcrimson");
    expect(conexionesAbiertas()).toBe(1);
    FakeEventSource.instancias[0].emitir({ tipo: "grito", entrada: 3, indice: "gritos/kingcrimson" });
    expect(a).toHaveBeenCalledWith({ tipo: "grito", entrada: 3, indice: "gritos/kingcrimson" });
    expect(b).toHaveBeenCalledTimes(1);
    quitarA();
    expect(FakeEventSource.instancias[0].cerrado).toBeUndefined();
    quitarB();
    expect(FakeEventSource.instancias[0].cerrado).toBe(true);
    expect(conexionesAbiertas()).toBe(0);
  });

  it("salas distintas, conexiones distintas; despues de cerrar, una nueva abre otra", () => {
    const q1 = escucharSala("foroscomun", jest.fn());
    const q2 = escucharSala("ciudadanos/5726", jest.fn());
    expect(FakeEventSource.instancias).toHaveLength(2);
    q1();
    q2();
    const q3 = escucharSala("foroscomun", jest.fn());
    expect(FakeEventSource.instancias).toHaveLength(3);
    q3();
  });

  it("un evento mal formado no tumba a los oyentes", () => {
    const a = jest.fn();
    const quitar = escucharSala("gritos/x", a);
    FakeEventSource.instancias[0].emitir("{no json");
    FakeEventSource.instancias[0].emitir({ tipo: "grito", entrada: 1, indice: "gritos/x" });
    expect(a).toHaveBeenCalledTimes(1);
    quitar();
  });

  it("si el servidor cierra la conexion para siempre (429), la sala se olvida y una nueva reintenta", () => {
    const quitar = escucharSala("gritos/y", jest.fn());
    const es = FakeEventSource.instancias[0];
    es.readyState = 2;
    es.onerror();
    expect(conexionesAbiertas()).toBe(0);
    const quitar2 = escucharSala("gritos/y", jest.fn());
    expect(FakeEventSource.instancias).toHaveLength(2);
    quitar();
    quitar2();
  });

  it("sin EventSource en el navegador no hace nada y no falla", () => {
    delete global.EventSource;
    const quitar = escucharSala("gritos/z", jest.fn());
    expect(() => quitar()).not.toThrow();
  });
});
