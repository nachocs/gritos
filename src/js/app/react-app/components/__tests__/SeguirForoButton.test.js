import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserContext } from "../../contexts/UserContext";
import SeguirForoButton from "../SeguirForoButton";

const montar = (props, user = { ID: "17426", uid: "a".repeat(48) }) =>
  render(
    <UserContext.Provider value={{ user }}>
      <SeguirForoButton {...props} />
    </UserContext.Provider>,
  );

let foros, postRespuesta;
beforeEach(() => {
  foros = [];
  postRespuesta = { estado: 200, datos: { ok: true } };
  global.fetch = jest.fn((url, op) => {
    if (op.method === "POST") {
      return Promise.resolve({ status: postRespuesta.estado, json: () => Promise.resolve(postRespuesta.datos) });
    }
    return Promise.resolve({ status: 200, json: () => Promise.resolve({ foros }) });
  });
});
afterEach(() => {
  delete global.fetch;
});

describe("SeguirForoButton", () => {
  it("sin sesion no pinta nada ni pide nada", () => {
    const { container } = montar({ clave: "gritos/kingcrimson" }, { ID: "1" });
    expect(container).toBeEmptyDOMElement();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("no se sigue el propio muro", async () => {
    const { container } = montar({ clave: "ciudadanos/17426", esMuro: true });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container).toBeEmptyDOMElement();
  });

  it("seguir: manda la clase foro con la clave y el titulo, y pasa a 'Siguiendo'", async () => {
    montar({ clave: "gritos/kingcrimson", titulo: "king Crimson" });
    const boton = await screen.findByRole("button", { name: /Seguir este foro/ });
    fireEvent.click(boton);
    await screen.findByText("Siguiendo ✓");
    const [url, op] = global.fetch.mock.calls.find(([, o]) => o.method === "POST");
    expect(url).toBe("/avisos-api/seguir");
    expect(JSON.parse(op.body)).toEqual({ clase: "foro", clave: "gritos/kingcrimson", etiqueta: "king Crimson" });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Te avisaremos");
  });

  it("si ya se sigue arranca en 'Siguiendo' y al pulsar deja de seguir (/dejar)", async () => {
    foros = [{ clave: "foroscomun", etiqueta: "x" }];
    montar({ clave: "foroscomun" });
    const boton = await screen.findByText("Siguiendo ✓");
    fireEvent.click(boton);
    await screen.findByRole("button", { name: /Seguir este foro/ });
    expect(global.fetch.mock.calls.find(([, o]) => o.method === "POST")[0]).toBe("/avisos-api/dejar");
  });

  it("un muro dice 'este muro'", async () => {
    montar({ clave: "ciudadanos/5726", esMuro: true });
    expect(await screen.findByRole("button", { name: /Seguir este muro/ })).toBeInTheDocument();
  });

  it("409 (demasiadas cosas) no cambia el estado y lo explica; un fallo de red tambien", async () => {
    postRespuesta = { estado: 409, datos: { error: "demasiados" } };
    montar({ clave: "foroscomun" });
    fireEvent.click(await screen.findByRole("button", { name: /Seguir este foro/ }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("demasiadas cosas"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    global.fetch = jest.fn((url, op) => (op.method === "POST" ? Promise.reject(new Error("red")) : Promise.resolve({ status: 200, json: () => Promise.resolve({ foros: [] }) })));
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No hay conexión"));
  });
});
