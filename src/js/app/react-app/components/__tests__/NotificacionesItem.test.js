import { fireEvent, render, screen } from "@testing-library/react";
import NotificacionesItem from "../NotificacionesItem";

describe("NotificacionesItem (bandeja de notificaciones)", () => {
  const base = { id: 7, titulo: "Ana ha respondido a tu grito en king Crimson", texto: "Cierto", de_alias: "Ana", veces: 1, actualizada: 1700000000, leida: null, url: "https://gritos.com/kingcrimson/55" };

  it("pinta el titulo, el extracto con el alias y marca lo no leido", () => {
    render(<NotificacionesItem item={base} onClick={() => {}} />);
    expect(screen.getByText(/ha respondido a tu grito en king Crimson/)).toBeInTheDocument();
    expect(screen.getByText("Ana: Cierto")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveClass("notificacion-sin-leer");
  });

  it("una leida no lleva la marca, y varias iguales muestran el contador", () => {
    render(<NotificacionesItem item={{ ...base, leida: 1700000100, veces: 3 }} onClick={() => {}} />);
    expect(screen.getByRole("link")).not.toHaveClass("notificacion-sin-leer");
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
  });

  it("el texto entra como texto: nada de HTML", () => {
    const { container } = render(<NotificacionesItem item={{ ...base, titulo: "<img src=x onerror=alert(1)>", texto: "<b>hola</b>" }} onClick={() => {}} />);
    expect(container.querySelector("img[src='x']")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText(/<b>hola<\/b>/)).toBeInTheDocument();
  });

  it("se abre con el clic y con Enter", () => {
    const onClick = jest.fn();
    render(<NotificacionesItem item={base} onClick={onClick} />);
    fireEvent.click(screen.getByRole("link"));
    fireEvent.keyDown(screen.getByRole("link"), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("link"), { key: "a" });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
