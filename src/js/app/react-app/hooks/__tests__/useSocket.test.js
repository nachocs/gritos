import { act, renderHook, waitFor } from "@testing-library/react";
import useSocket from "../useSocket";

jest.mock("../../../util/endpoints", () => ({ apiUrl: "http://localhost/api/" }));

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
    this.cerrado = true;
  }
  emitir(d) {
    this.oyentes.sala({ data: JSON.stringify(d) });
  }
}
const respuesta = (datos) => ({
  ok: true,
  headers: { get: () => "application/json; charset=utf-8" },
  arrayBuffer: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(datos)).buffer),
});

let pedidos;
beforeEach(() => {
  FakeEventSource.instancias = [];
  pedidos = [];
  global.EventSource = FakeEventSource;
  global.fetch = jest.fn((url) => {
    pedidos.push(url);
    const m = /index\.cgi\?(.+)\/(\d+)$/.exec(url);
    return Promise.resolve(respuesta({ ID: m[2], INDICE: m[1], comments: "hola" }));
  });
});
afterEach(() => {
  delete global.EventSource;
  delete global.fetch;
});

describe("useSocket (gritos en vivo por las salas de la bandeja)", () => {
  it("una lista recibe los gritos nuevos de su foro: pide el mensaje a la API y llama con { room, entry }", async () => {
    const cb = jest.fn();
    renderHook(() => useSocket("collection:kingcrimson", "updated", cb));
    expect(FakeEventSource.instancias[0].url).toContain("sala=gritos%2Fkingcrimson");
    act(() => FakeEventSource.instancias[0].emitir({ tipo: "grito", entrada: 55, indice: "gritos/kingcrimson" }));
    await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
    expect(pedidos).toEqual(["http://localhost/api/index.cgi?gritos/kingcrimson/55"]);
    expect(cb).toHaveBeenCalledWith({ room: "collection:kingcrimson", entry: { ID: "55", INDICE: "gritos/kingcrimson", comments: "hola" } });
  });

  it("foroscomun recibe mensajes de OTROS indices (muros, otros foros): los pide por su indice real", async () => {
    const cb = jest.fn();
    renderHook(() => useSocket("collection:foroscomun", "updated", cb));
    act(() => FakeEventSource.instancias[0].emitir({ tipo: "grito", entrada: 9, indice: "ciudadanos/48586" }));
    await waitFor(() => expect(cb).toHaveBeenCalled());
    expect(pedidos[0]).toBe("http://localhost/api/index.cgi?ciudadanos/48586/9");
  });

  it("una lista ignora las respuestas (son de los hilos)", async () => {
    const cb = jest.fn();
    renderHook(() => useSocket("collection:kingcrimson", "updated", cb));
    act(() => FakeEventSource.instancias[0].emitir({ tipo: "respuesta", entrada: 3, indice: "gritos/kingcrimson/38631" }));
    await new Promise((r) => setTimeout(r, 30));
    expect(cb).not.toHaveBeenCalled();
    expect(pedidos).toEqual([]);
  });

  it("un hilo escucha la sala de su foro pero solo recibe SUS respuestas", async () => {
    const cb = jest.fn();
    renderHook(() => useSocket("collection:gritos/kingcrimson/38631", "updated", cb));
    expect(FakeEventSource.instancias[0].url).toContain("sala=gritos%2Fkingcrimson");
    const es = FakeEventSource.instancias[0];
    act(() => es.emitir({ tipo: "respuesta", entrada: 4, indice: "gritos/kingcrimson/99999" }));
    act(() => es.emitir({ tipo: "grito", entrada: 5, indice: "gritos/kingcrimson" }));
    act(() => es.emitir({ tipo: "respuesta", entrada: 6, indice: "gritos/kingcrimson/38631" }));
    await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
    expect(pedidos).toEqual(["http://localhost/api/index.cgi?gritos/kingcrimson/38631/6"]);
  });

  it("un mismo mensaje no se entrega dos veces", async () => {
    const cb = jest.fn();
    renderHook(() => useSocket("collection:kingcrimson", "updated", cb));
    const ev = { tipo: "grito", entrada: 8, indice: "gritos/kingcrimson" };
    act(() => { FakeEventSource.instancias[0].emitir(ev); FakeEventSource.instancias[0].emitir(ev); });
    await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 30));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(pedidos).toHaveLength(1);
  });

  it("un evento sin indice (los de dreamers.es) o roto no hace nada", async () => {
    const cb = jest.fn();
    renderHook(() => useSocket("collection:kingcrimson", "updated", cb));
    act(() => FakeEventSource.instancias[0].emitir({ tipo: "grito", entrada: 8 }));
    act(() => FakeEventSource.instancias[0].emitir({ tipo: "grito", indice: "gritos/kingcrimson" }));
    await new Promise((r) => setTimeout(r, 30));
    expect(cb).not.toHaveBeenCalled();
  });

  it("si la API falla o no hay mensaje, no se llama ni se rompe nada", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404, headers: { get: () => "" } }));
    const cb = jest.fn();
    renderHook(() => useSocket("collection:kingcrimson", "updated", cb));
    act(() => FakeEventSource.instancias[0].emitir({ tipo: "grito", entrada: 1, indice: "gritos/kingcrimson" }));
    await new Promise((r) => setTimeout(r, 30));
    expect(cb).not.toHaveBeenCalled();
  });

  it("sin sala, sin callback, o con un tipo que no es 'updated': no abre nada", () => {
    renderHook(() => useSocket(null, "updated", jest.fn()));
    renderHook(() => useSocket("collection:x", "updated", null));
    renderHook(() => useSocket("collection:x", "msg", jest.fn()));
    renderHook(() => useSocket("collection:a b", "updated", jest.fn()));
    expect(FakeEventSource.instancias).toHaveLength(0);
  });

  it("al desmontar cierra la conexion y un mensaje que llegue despues no llama", async () => {
    const cb = jest.fn();
    const { unmount } = renderHook(() => useSocket("collection:kingcrimson", "updated", cb));
    const es = FakeEventSource.instancias[0];
    act(() => es.emitir({ tipo: "grito", entrada: 2, indice: "gritos/kingcrimson" }));
    unmount();
    expect(es.cerrado).toBe(true);
    await new Promise((r) => setTimeout(r, 30));
    expect(cb).not.toHaveBeenCalled();
  });
});
