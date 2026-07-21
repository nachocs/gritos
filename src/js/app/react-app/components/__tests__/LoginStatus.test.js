import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserProvider } from "../../contexts/UserContext";
import LoginStatus from "../LoginStatus";
import ModalRoot from "../ModalRoot";

// LoginStatus no longer renders its own login form inline — clicking "Log In"
// opens the shared modal (LoginModal via ModalRoot's event bus), so these
// tests render both together, the same way Layout does in the real app.
describe("LoginStatus Component", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const renderWithProviders = () =>
    render(
      <UserProvider>
        <LoginStatus />
        <ModalRoot />
      </UserProvider>,
    );

  it("should render login button when user is not logged in", () => {
    renderWithProviders();

    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("should open the login modal when login button is clicked", () => {
    renderWithProviders();

    const loginButton = screen.getByText("Log In");
    fireEvent.click(loginButton);

    // After clicking, the login modal should appear with form fields
    expect(screen.getByLabelText(/Alias\/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it("should handle login form submission", async () => {
    global.fetch = jest.fn(
      () =>
        new Promise(() => {
          // Keep the request pending so the component remains in loading state.
        }),
    );

    renderWithProviders();

    const loginButton = screen.getByText("Log In");
    fireEvent.click(loginButton);

    const aliasInput = screen.getByLabelText(/Alias\/email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(aliasInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByRole("button", { name: /entrar/i });
    fireEvent.click(submitButton);

    // The button should show loading state
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Entrando/i }),
      ).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should show error message when credentials are missing", () => {
    renderWithProviders();

    const loginButton = screen.getByText("Log In");
    fireEvent.click(loginButton);

    const submitButton = screen.getByRole("button", { name: /entrar/i });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/Alias y contraseña son obligatorios/i),
    ).toBeInTheDocument();
  });
});
