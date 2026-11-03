import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Cabecera from "../Cabecera";
import useJsonSearch from "../../hooks/useJsonSearch";

jest.mock("../NotificacionesButton", () => () => null);
jest.mock("../LoginStatus", () => () => null);
jest.mock("../../hooks/useJsonSearch");

// La cabecera del diseño nuevo (?diseno=26): mismos destinos que Header, y las
// pestañas Gritos · Galería · Votaciones con las condiciones de las miniaturas de
// la barra lateral a la que sustituyen.
describe("Cabecera", () => {
  const conDatos = ({ imagen = true, encuesta = true } = {}) =>
    useJsonSearch.mockImplementation(({ encontrar }) => ({
      data:
        encontrar === "Ficheros"
          ? imagen
            ? [{ IMAGEN1_URL: "x.jpg" }]
            : []
          : encuesta
            ? [{ comments: "¿Qué os parece?" }]
            : [],
    }));

  const pintar = (props = {}) =>
    render(
      <MemoryRouter>
        <Cabecera
          head={{ Titulo: "Comic a Gritos" }}
          currentForo="comic"
          base="comic"
          onMenuClick={() => {}}
          {...props}
        />
      </MemoryRouter>,
    );

  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    window.localStorage.clear();
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  it("la marca va a la portada y el titulo al foro", () => {
    conDatos();
    pintar();
    expect(screen.getByLabelText("gritos.com, portada")).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Comic a Gritos").closest("a")).toHaveAttribute(
      "href",
      "/comic",
    );
  });

  it("pestañas del foro con la activa marcada", () => {
    conDatos();
    pintar({ isGallery: true });
    const pestanas = screen
      .getAllByRole("link", { name: /Gritos|Galería|Votaciones/ })
      .filter((a) => a.classList.contains("cab26-pestana"));
    expect(
      pestanas.map((a) => [a.textContent, a.getAttribute("href")]),
    ).toEqual([
      ["Gritos", "/comic"],
      ["Galería", "/comic/gallery"],
      ["Votaciones", "/comic/votaciones"],
    ]);
    expect(screen.getByText("Galería")).toHaveAttribute("aria-current", "page");
  });

  it("sin imagenes ni encuestas solo queda la de los gritos (como las miniaturas)", () => {
    conDatos({ imagen: false, encuesta: false });
    pintar();
    expect(screen.queryByText("Galería")).toBeNull();
    expect(screen.queryByText("Votaciones")).toBeNull();
    expect(screen.getByText("Gritos")).toBeInTheDocument();
  });

  it("en un muro: «Muro» y las rutas de ciudadanos", () => {
    conDatos();
    pintar({
      head: { Titulo: "Nacho" },
      currentForo: "foroscomun",
      esMuro: true,
      base: "ciudadanos/1",
    });
    expect(
      screen.getByText("Muro", { selector: ".cab26-pestana" }),
    ).toHaveAttribute("href", "/ciudadanos/1");
    expect(screen.getByText("Nacho").closest("a")).toHaveAttribute(
      "href",
      "/ciudadanos/1",
    );
  });

  it("en la portada no hay pestañas sino el lema", () => {
    conDatos();
    pintar({ head: null, currentForo: "foroscomun", base: "foroscomun" });
    expect(screen.getByText("Grita sin cortarte un pelo")).toBeInTheDocument();
    expect(document.querySelector(".cab26-pestanas")).toBeNull();
  });

  it("el boton de tema fija lo contrario de lo que se ve y lo recuerda", () => {
    conDatos();
    pintar();
    const boton = screen.getByRole("button", {
      name: "Cambiar al tema oscuro",
    });
    fireEvent.click(boton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem("gritos-tema")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Cambiar al tema claro" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
