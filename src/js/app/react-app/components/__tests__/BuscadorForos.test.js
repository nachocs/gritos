import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BuscadorForos from "../BuscadorForos";
import { fetchJson } from "../../utils/apiFetch";
import { _reiniciarForos, buscarForos, normalizar } from "../../hooks/useForos";

jest.mock("../../utils/apiFetch");

// Lo que devuelve foros.cgi: nombre y titulo, con entidades HTML como en el motor.
const FOROS = [
  { name: "comic", titulo: "Comic a Gritos" },
  { name: "comicmx", titulo: "C&oacute;mic chilango" },
  { name: "kingcrimson", titulo: "king Crimson" },
  { name: "historietas", titulo: "Viejos c&oacute;mics de quiosco" },
  { name: "videojuegos", titulo: "Videojuegos a Gritos" },
];

const Donde = () => <span data-testid="ruta">{useLocation().pathname}</span>;

const pintar = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <BuscadorForos />
              <Donde />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("BuscadorForos", () => {
  beforeEach(() => {
    _reiniciarForos();
    fetchJson.mockReset();
    fetchJson.mockResolvedValue(FOROS);
  });

  it("no pide la lista hasta que alguien entra en el campo", async () => {
    pintar();
    expect(fetchJson).not.toHaveBeenCalled();
    fireEvent.focus(screen.getByLabelText("Buscar un foro"));
    await waitFor(() => expect(fetchJson).toHaveBeenCalledTimes(1));
    expect(fetchJson.mock.calls[0][0]).toMatch(/foros\.cgi$/);
  });

  it("encuentra sin tildes ni mayusculas, y primero lo que empieza por lo escrito", async () => {
    pintar();
    const campo = screen.getByLabelText("Buscar un foro");
    fireEvent.focus(campo);
    fireEvent.change(campo, { target: { value: "COMIC" } });
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(3));
    expect(
      screen
        .getAllByRole("option")
        .map((o) => o.querySelector("b").textContent),
    ).toEqual(["Comic a Gritos", "Cómic chilango", "Viejos cómics de quiosco"]);
  });

  it("con Intro va al foro elegido; las flechas mueven la seleccion", async () => {
    pintar();
    const campo = screen.getByLabelText("Buscar un foro");
    fireEvent.focus(campo);
    fireEvent.change(campo, { target: { value: "gritos" } });
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    fireEvent.keyDown(campo, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.keyDown(campo, { key: "Enter" });
    expect(screen.getByTestId("ruta").textContent).toBe("/videojuegos");
    expect(campo).toHaveValue("");
  });

  it("si no hay ninguno, lo dice; Escape borra lo escrito", async () => {
    pintar();
    const campo = screen.getByLabelText("Buscar un foro");
    fireEvent.focus(campo);
    fireEvent.change(campo, { target: { value: "zzzz" } });
    await waitFor(() =>
      expect(
        screen.getByText("¡Silencio! Ningún foro se llama así."),
      ).toBeInTheDocument(),
    );
    fireEvent.keyDown(campo, { key: "Escape" });
    expect(campo).toHaveValue("");
  });
});

describe("buscarForos", () => {
  const lista = FOROS.map((f) => ({
    ...f,
    clave: `${normalizar(f.titulo.replace("&oacute;", "ó"))} ${normalizar(f.name)}`,
  }));

  it("sin consulta no devuelve nada y respeta el maximo", () => {
    expect(buscarForos(lista, "  ")).toEqual([]);
    expect(buscarForos(lista, "o", 2)).toHaveLength(2);
  });
});
