import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UserProvider } from "../../contexts/UserContext";
import LoginStatus from "../LoginStatus";
import ModalRoot from "../ModalRoot";
import { openLoginMenu } from "../../utils/loginMenuEvents";

// Parity target: legacy main/header/loginView.js. The login form is a dropdown
// panel toggled by the header button, not a modal — the panel is always in the
// DOM and hidden with the `hidden` class.
describe("LoginStatus Component", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const renderWithProviders = () =>
    render(
      <MemoryRouter>
        <UserProvider>
          <LoginStatus />
          <ModalRoot />
        </UserProvider>
      </MemoryRouter>,
    );

  const menu = (container) => container.querySelector("ul.login-menu");
  const toggle = (container) =>
    container.querySelector("button.login-menu-button");

  it("renders the logged-out affordance with the menu hidden", () => {
    const { container } = renderWithProviders();

    expect(screen.getByText("Log In")).toBeInTheDocument();
    expect(menu(container)).toHaveClass("hidden");
  });

  it("toggles the login menu open and closed from the header button", () => {
    const { container } = renderWithProviders();

    fireEvent.click(toggle(container));
    expect(menu(container)).not.toHaveClass("hidden");

    // Legacy has no outside-click handler: the same button closes it again.
    fireEvent.click(toggle(container));
    expect(menu(container)).toHaveClass("hidden");
  });

  it("opens the menu when the composer FAB asks for a login", () => {
    const { container } = renderWithProviders();

    // Fired from outside React (Layout's FAB handler), so it needs act().
    act(() => openLoginMenu());

    expect(menu(container)).not.toHaveClass("hidden");
  });

  it("submits alias/password to login.cgi", async () => {
    global.fetch = jest.fn(
      () =>
        new Promise(() => {
          // Keep the request pending; we only assert it was issued.
        }),
    );

    const { container } = renderWithProviders();
    fireEvent.click(toggle(container));

    fireEvent.change(screen.getByLabelText(/Alias\/email/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch.mock.calls[0][0]).toContain("login.cgi");
  });

  it("does not call login.cgi when a field is empty", () => {
    global.fetch = jest.fn();

    const { container } = renderWithProviders();
    fireEvent.click(toggle(container));
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    // Legacy bails out with a console.log and shows no error.
    expect(global.fetch).not.toHaveBeenCalled();
    expect(container.querySelector(".error-login")).not.toHaveClass("active");
  });

  it("opens the sign-up modal from the menu", () => {
    const { container } = renderWithProviders();
    fireEvent.click(toggle(container));

    fireEvent.click(screen.getByText(/Regístrate \/ Sign Up/i));

    expect(
      screen.getByRole("heading", { name: /Regístrate/i }),
    ).toBeInTheDocument();
  });
});
