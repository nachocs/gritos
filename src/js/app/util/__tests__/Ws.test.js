// Ws crea el socket al importarse: se sustituye socket.io-client por uno de mentira.
const creados = [];
jest.mock("socket.io-client", () => ({
  __esModule: true,
  default: jest.fn((url, opciones) => {
    const manejadores = {};
    const socket = {
      url, opciones, manejadores, active: false, emitidos: [], conectado: 0,
      on: (evento, fn) => { manejadores[evento] = fn; },
      emit: (...args) => { socket.emitidos.push(args); },
      connect: () => { socket.conectado += 1; socket.active = true; },
    };
    creados.push(socket);
    return socket;
  }),
}));
jest.mock("../endpoints", () => ({ __esModule: true, default: { socket: "http://localhost" } }));
jest.mock("../vent", () => ({ __esModule: true, default: { trigger: jest.fn() } }));

import ws from "../Ws";
import vent from "../vent";

describe("Ws (solo vistas previas de enlaces)", () => {
  const socket = creados[0];

  it("no abre el socket al cargar la pagina", () => {
    expect(socket.opciones.autoConnect).toBe(false);
    expect(socket.conectado).toBe(0);
    expect(socket.emitidos).toEqual([]);
  });

  it("al pedir una vista previa conecta una sola vez y emite la peticion", () => {
    ws.captureUrlRequest("5726", "https://example.org/a");
    ws.captureUrlRequest("5726", "https://example.org/b");
    expect(socket.conectado).toBe(1);
    expect(socket.emitidos).toEqual([
      ["capture_url_request", "5726", "https://example.org/a"],
      ["capture_url_request", "5726", "https://example.org/b"],
    ]);
  });

  it("la respuesta se reparte por vent para quien la pidio", () => {
    socket.manejadores.capture_url_reply({ user: "5726", reply: { title: "t" } });
    expect(vent.trigger).toHaveBeenCalledWith("capture_url_reply_5726", { user: "5726", reply: { title: "t" } });
  });

  it("ya no ofrece salas ni avisos por el socket", () => {
    for (const metodo of ["subscribe", "unsubscribe", "update", "prepararNotificaciones"]) {
      expect(ws[metodo]).toBeUndefined();
    }
  });
});
