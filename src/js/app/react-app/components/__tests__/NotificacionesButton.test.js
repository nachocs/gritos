import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { NotificationsContext } from "../../contexts/NotificationsContext";
import { UserContext } from "../../contexts/UserContext";
import NotificacionesButton from "../NotificacionesButton";

const Donde = () => <span data-testid="donde">{useLocation().pathname}</span>;
const aviso = (id, url, extra = {}) => ({ id, clave: `k${id}`, titulo: `Aviso ${id}`, texto: "", url, veces: 1, actualizada: 1700000000, leida: null, ...extra });

const montar = (notifications, ctx = {}) => {
  const valor = { notifications, unreadCount: notifications.filter((n) => !n.leida).length, markNotificationAsRead: jest.fn(), markAllAsRead: jest.fn(), ...ctx };
  render(
    <UserContext.Provider value={{ user: { ID: "17426", uid: "a".repeat(48) } }}>
      <NotificationsContext.Provider value={valor}>
        <MemoryRouter initialEntries={["/foroscomun"]}>
          <NotificacionesButton />
          <Routes><Route path="*" element={<Donde />} /></Routes>
        </MemoryRouter>
      </NotificationsContext.Provider>
    </UserContext.Provider>,
  );
  return valor;
};

describe("NotificacionesButton", () => {
  const abrir = () => fireEvent.click(screen.getByTitle("Notificaciones"));

  it("muestra el contador de no leidas y abrir el panel NO las marca todas", () => {
    const v = montar([aviso(1, "https://gritos.com/a/1"), aviso(2, "https://gritos.com/a/2")]);
    expect(screen.getByTitle("Notificaciones")).toHaveAttribute("data-badge", "2");
    abrir();
    expect(v.markNotificationAsRead).not.toHaveBeenCalled();
    expect(v.markAllAsRead).not.toHaveBeenCalled();
  });

  it("un aviso de gritos.com navega dentro de la app y se marca leido", () => {
    const v = montar([aviso(1, "https://gritos.com/kingcrimson/55")]);
    abrir();
    fireEvent.click(screen.getByText("Aviso 1"));
    expect(screen.getByTestId("donde").textContent).toBe("/kingcrimson/55");
    expect(v.markNotificationAsRead).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("un aviso de dreamers.es abre dreamers.es (y no navega dentro)", () => {
    const original = window.location;
    delete window.location;
    window.location = { href: "" };
    try {
      const v = montar([aviso(1, "/articulos/970#g5")]);
      abrir();
      fireEvent.click(screen.getByText("Aviso 1"));
      expect(window.location.href).toBe("https://dreamers.es/articulos/970#g5");
      expect(screen.getByTestId("donde").textContent).toBe("/foroscomun");
      expect(v.markNotificationAsRead).toHaveBeenCalled();
    } finally {
      window.location = original;
    }
  });

  it("un aviso con una URL peligrosa se marca leido pero no navega a ninguna parte", () => {
    const original = window.location;
    delete window.location;
    window.location = { href: "" };
    try {
      montar([aviso(1, "javascript:alert(1)")]);
      abrir();
      fireEvent.click(screen.getByText("Aviso 1"));
      expect(window.location.href).toBe("");
      expect(screen.getByTestId("donde").textContent).toBe("/foroscomun");
    } finally {
      window.location = original;
    }
  });

  it("el pie: marcar todas, y los enlaces a todas y a los ajustes (en dreamers.es)", () => {
    const v = montar([aviso(1, "https://gritos.com/a/1")]);
    abrir();
    fireEvent.click(screen.getByText("Marcar todas como leídas"));
    expect(v.markAllAsRead).toHaveBeenCalled();
    expect(screen.getByText("Ajustes")).toHaveAttribute("href", "https://dreamers.es/ciudad/mi/avisos");
    expect(screen.getByText("Ver todas")).toHaveAttribute("href", "https://dreamers.es/ciudad/mi/notificaciones");
  });

  it("sin avisos dice que no hay y sin sesion no pinta nada", () => {
    montar([]);
    expect(screen.getByText(/Aquí verás cuándo/)).toBeInTheDocument();
  });
});
