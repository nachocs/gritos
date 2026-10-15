import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { UserContext } from "../UserContext";
import { autoActivar } from "../../utils/pushAvisos";
import { NotificationsContext, NotificationsProvider } from "../NotificationsContext";

jest.mock("../../utils/pushAvisos", () => ({ autoActivar: jest.fn(() => Promise.resolve(false)) }));

// EventSource de mentira: guarda las instancias para poder "emitir" eventos del servidor
class FakeEventSource {
  static instancias = [];
  constructor(url) {
    this.url = url;
    this.oyentes = {};
    this.readyState = 1;
    FakeEventSource.instancias.push(this);
  }
  addEventListener(nombre, f) {
    (this.oyentes[nombre] = this.oyentes[nombre] || []).push(f);
  }
  close() {
    this.readyState = 2;
    this.cerrado = true;
  }
  emitir(nombre, datos, lastEventId = "") {
    (this.oyentes[nombre] || []).forEach((f) => f({ data: JSON.stringify(datos), lastEventId }));
  }
}

const aviso = (id, clave, extra = {}) => ({ id, clave, titulo: `T${id}`, texto: "", url: "https://gritos.com/x/1", veces: 1, actualizada: 1700000000 + id, leida: null, ...extra });

let respuestas;
const Sonda = () => {
  const c = useContext(NotificationsContext);
  return (
    <div>
      <span data-testid="sin-leer">{c.unreadCount}</span>
      <span data-testid="cargando">{String(c.loading)}</span>
      <ul>{c.notifications.map((n) => <li key={n.id} data-leida={n.leida ? "1" : "0"}>{n.titulo}</li>)}</ul>
      <button onClick={() => c.markNotificationAsRead(c.notifications[0])}>leer-primera</button>
      <button onClick={() => c.markAllAsRead()}>leer-todas</button>
    </div>
  );
};
const montar = (user = { ID: "17426", uid: "a".repeat(48) }) =>
  render(
    <UserContext.Provider value={{ user }}>
      <NotificationsProvider><Sonda /></NotificationsProvider>
    </UserContext.Provider>,
  );

beforeEach(() => {
  FakeEventSource.instancias = [];
  global.EventSource = FakeEventSource;
  respuestas = { "lista?limite=20": { estado: 200, datos: { sinLeer: 2, notificaciones: [aviso(2, "respuesta|a"), aviso(1, "mola|b")] } }, leer: { estado: 200, datos: { sinLeer: 1 } } };
  global.fetch = jest.fn((url) => {
    const ruta = url.replace("/avisos-api/", "");
    const r = respuestas[ruta] || { estado: 404, datos: {} };
    return Promise.resolve({ status: r.estado, json: () => Promise.resolve(r.datos) });
  });
});
afterEach(() => {
  delete global.EventSource;
  delete global.fetch;
  jest.useRealTimers();
});

describe("NotificationsProvider (bandeja de notificaciones)", () => {
  it("sin sesion no pide nada ni abre conexion", async () => {
    montar({ ID: "17426" });
    await waitFor(() => expect(screen.getByTestId("cargando").textContent).toBe("false"));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(FakeEventSource.instancias).toHaveLength(0);
  });

  it("al entrar intenta reactivar los avisos del dispositivo de esta cuenta (y sin sesion no)", async () => {
    autoActivar.mockClear();
    montar({ ID: "17426" });
    expect(autoActivar).not.toHaveBeenCalled();
    montar();
    await waitFor(() => expect(autoActivar).toHaveBeenCalledWith("a".repeat(48), "17426"));
  });

  it("carga la lista con la sesion como Bearer y abre el stream", async () => {
    montar();
    await waitFor(() => expect(screen.getByText("T2")).toBeInTheDocument());
    expect(screen.getByTestId("sin-leer").textContent).toBe("2");
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${"a".repeat(48)}`);
    expect(FakeEventSource.instancias).toHaveLength(1);
    expect(FakeEventSource.instancias[0].url).toBe("/avisos-api/stream");
  });

  it("un aviso nuevo llega en vivo; uno de la misma clave sustituye al anterior (el servidor agrupa)", async () => {
    montar();
    await waitFor(() => expect(screen.getByText("T2")).toBeInTheDocument());
    const es = FakeEventSource.instancias[0];
    act(() => es.emitir("notif", aviso(3, "foro|c"), "3"));
    expect(screen.getByText("T3")).toBeInTheDocument();
    act(() => es.emitir("notif", aviso(4, "respuesta|a", { titulo: "T4 (agrupado)" }), "4"));
    expect(screen.getByText("T4 (agrupado)")).toBeInTheDocument();
    expect(screen.queryByText("T2")).not.toBeInTheDocument();
    expect(screen.getByText("T3")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("el evento estado actualiza el contador, y un evento mal formado no tumba nada", async () => {
    montar();
    await waitFor(() => expect(screen.getByText("T2")).toBeInTheDocument());
    const es = FakeEventSource.instancias[0];
    act(() => es.emitir("estado", { sinLeer: 9 }));
    expect(screen.getByTestId("sin-leer").textContent).toBe("9");
    act(() => es.oyentes.estado.forEach((f) => f({ data: "{no json" })));
    act(() => es.oyentes.notif.forEach((f) => f({ data: "[[", lastEventId: "" })));
    expect(screen.getByTestId("sin-leer").textContent).toBe("9");
  });

  it("marcar una como leida: la pinta leida y avisa al servidor con su id", async () => {
    montar();
    await waitFor(() => expect(screen.getByText("T2")).toBeInTheDocument());
    await act(async () => screen.getByText("leer-primera").click());
    expect(screen.getByText("T2").getAttribute("data-leida")).toBe("1");
    const llamada = global.fetch.mock.calls.find(([u]) => u.endsWith("/leer"));
    expect(JSON.parse(llamada[1].body)).toEqual({ ids: [2] });
    await waitFor(() => expect(screen.getByTestId("sin-leer").textContent).toBe("1"));
  });

  it("marcar todas manda todas:true", async () => {
    montar();
    await waitFor(() => expect(screen.getByText("T2")).toBeInTheDocument());
    await act(async () => screen.getByText("leer-todas").click());
    const llamada = global.fetch.mock.calls.find(([u]) => u.endsWith("/leer"));
    expect(JSON.parse(llamada[1].body)).toEqual({ todas: true });
    expect(screen.getByText("T1").getAttribute("data-leida")).toBe("1");
  });

  it("si el stream se cierra para siempre (401/429), cae al sondeo del contador y recarga la lista cuando sube", async () => {
    jest.useFakeTimers();
    montar();
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(screen.getByText("T2")).toBeInTheDocument());
    respuestas.contador = { estado: 200, datos: { sinLeer: 5 } };
    respuestas["lista?limite=20"] = { estado: 200, datos: { sinLeer: 5, notificaciones: [aviso(9, "foro|z", { titulo: "T9" })] } };
    const es = FakeEventSource.instancias[0];
    es.readyState = 2;
    act(() => es.onerror());
    await act(async () => { jest.advanceTimersByTime(60000); });
    await waitFor(() => expect(screen.getByText("T9")).toBeInTheDocument());
    expect(screen.getByTestId("sin-leer").textContent).toBe("5");
  });

  it("sin EventSource en el navegador tambien sondea", async () => {
    delete global.EventSource;
    jest.useFakeTimers();
    montar();
    await act(async () => { await Promise.resolve(); });
    respuestas.contador = { estado: 200, datos: { sinLeer: 0 } };
    await act(async () => { jest.advanceTimersByTime(60000); });
    expect(global.fetch.mock.calls.some(([u]) => u.endsWith("/contador"))).toBe(true);
  });

  it("al desmontar cierra la conexion", async () => {
    const { unmount } = montar();
    await waitFor(() => expect(FakeEventSource.instancias).toHaveLength(1));
    unmount();
    expect(FakeEventSource.instancias[0].cerrado).toBe(true);
  });
});
