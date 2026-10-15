// Ws abre el socket al importarse: se sustituye socket.io-client por uno de mentira que deja disparar 'connect'.
const manejadores = {};
const emitidos = [];
jest.mock("socket.io-client", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: (evento, fn) => { manejadores[evento] = fn; },
    emit: (...args) => { emitidos.push(args); },
  })),
}));
jest.mock("../endpoints", () => ({ __esModule: true, default: { socket: "http://localhost" } }));

import ws from "../Ws";

describe("Ws tras reconectar", () => {
  beforeEach(() => { emitidos.length = 0; });

  it("la primera conexion no repite lo que ya se emitio", () => {
    ws.subscribe("gritos/foro/1");
    ws.prepararNotificaciones("5726", "uid-de-sesion");
    manejadores.connect();
    expect(emitidos).toEqual([
      ["subscribe", "gritos/foro/1"],
      ["prepararNotificaciones", "5726", "uid-de-sesion"],
    ]);
  });

  it("al reconectar vuelve a entrar en las salas y a pedir los avisos con la sesion", () => {
    ws.subscribe("ciudadanos/5726");
    emitidos.length = 0;
    manejadores.connect(); // segunda conexion = reconexion
    expect(emitidos).toEqual(expect.arrayContaining([
      ["subscribe", "gritos/foro/1"],
      ["subscribe", "ciudadanos/5726"],
      ["prepararNotificaciones", "5726", "uid-de-sesion"],
    ]));
  });

  it("una sala de la que se salio no se vuelve a pedir", () => {
    ws.unsubscribe("gritos/foro/1");
    emitidos.length = 0;
    manejadores.connect();
    expect(emitidos).not.toEqual(expect.arrayContaining([["subscribe", "gritos/foro/1"]]));
  });
});
