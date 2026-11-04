import { fireEvent, render, screen } from "@testing-library/react";
import InvitaGritar from "../InvitaGritar";
import { useUser } from "../../hooks/useContexts";
import { onOpenLoginMenu } from "../../utils/loginMenuEvents";
import { onModalUpdate } from "../../utils/modalEvents";

jest.mock("../../hooks/useContexts", () => ({ useUser: jest.fn() }));

describe("InvitaGritar", () => {
  it("sin sesion invita a entrar y a registrarse", () => {
    useUser.mockReturnValue({ user: null, loading: false });
    const abrir = jest.fn();
    const quitar = onOpenLoginMenu(abrir);
    render(<InvitaGritar />);

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(abrir).toHaveBeenCalled();
    quitar();
  });

  it("«Regístrate» abre el alta", () => {
    useUser.mockReturnValue({ user: null, loading: false });
    const modal = jest.fn();
    const quitar = onModalUpdate(modal);
    render(<InvitaGritar />);

    fireEvent.click(screen.getByRole("button", { name: "Regístrate" }));
    expect(modal).toHaveBeenCalledWith(
      expect.objectContaining({ signUp: true }),
    );
    quitar();
  });

  it("no sale con sesion ni mientras se comprueba la cookie", () => {
    useUser.mockReturnValue({ user: { uid: "x" }, loading: false });
    const { container, rerender } = render(<InvitaGritar />);
    expect(container).toBeEmptyDOMElement();

    useUser.mockReturnValue({ user: null, loading: true });
    rerender(<InvitaGritar />);
    expect(container).toBeEmptyDOMElement();
  });
});
