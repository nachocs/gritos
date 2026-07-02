import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserProvider } from "../../contexts/UserContext";
import LoginStatus from "../LoginStatus";

describe("LoginStatus Component", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const renderWithProviders = (component) => {
    return render(<UserProvider>{component}</UserProvider>);
  };

  it("should render login button when user is not logged in", () => {
    renderWithProviders(<LoginStatus />);

    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("should show menu when login button is clicked", () => {
    renderWithProviders(<LoginStatus />);

    const loginButton = screen.getByText("Log In");
    fireEvent.click(loginButton);

    // After clicking, the menu should appear with form fields
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

    renderWithProviders(<LoginStatus />);

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
    renderWithProviders(<LoginStatus />);

    const loginButton = screen.getByText("Log In");
    fireEvent.click(loginButton);

    const submitButton = screen.getByRole("button", { name: /entrar/i });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/Alias y contraseña son obligatorios/i),
    ).toBeInTheDocument();
  });
});
