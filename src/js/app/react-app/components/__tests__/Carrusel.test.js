import { render, screen } from "@testing-library/react";
import Carrusel from "../Carrusel";

// jsdom no maqueta (todo mide 0): aqui solo el marcado. Que se pase de imagen, cuantas
// se ven y el zoom se prueban en un navegador de verdad.
describe("Carrusel", () => {
  const imagenes = [
    { src: "a.jpg", width: 400, height: 300 },
    { src: "b.jpg", width: 300, height: 600 },
    { src: "c.jpg" },
  ];

  it("una diapositiva por imagen, con texto alternativo numerado", () => {
    render(<Carrusel images={imagenes} />);
    expect(
      screen.getAllByRole("img").map((i) => i.getAttribute("alt")),
    ).toEqual(["imagen 1 de 3", "imagen 2 de 3", "imagen 3 de 3"]);
    expect(
      screen.getByRole("group", { name: "3 imágenes" }),
    ).toBeInTheDocument();
  });

  it("solo las altas llevan el zoom (img-hover), como antes", () => {
    render(<Carrusel images={imagenes} />);
    const [a, b, c] = screen.getAllByRole("img");
    expect(a).not.toHaveClass("img-hover");
    expect(b).toHaveClass("img-hover");
    expect(c).not.toHaveClass("img-hover");
  });

  it("al principio, «anteriores» esta apagada", () => {
    render(<Carrusel images={imagenes} />);
    expect(
      screen.getByRole("button", { name: "Imágenes anteriores" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Imágenes siguientes" }),
    ).toBeEnabled();
  });
});
