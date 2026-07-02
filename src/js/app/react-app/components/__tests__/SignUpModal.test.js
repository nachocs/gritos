import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationProvider } from "../../contexts/RegistrationContext";
import { UserProvider } from "../../contexts/UserContext";
import SignUpModal from "../SignUpModal";

// Mock vent module
jest.mock("../../../util/vent", () => ({
  trigger: jest.fn(),
}));

const renderSignUpModal = () => {
  return render(
    <UserProvider>
      <RegistrationProvider>
        <SignUpModal />
      </RegistrationProvider>
    </UserProvider>,
  );
};

describe("SignUpModal", () => {
  it("renders form fields", () => {
    renderSignUpModal();
    expect(screen.getByLabelText("Alias")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registrarse/i }),
    ).toBeInTheDocument();
  });

  it("validates input fields", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    const submitBtn = screen.getByRole("button", { name: /Registrarse/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Alias mínimo 4 caracteres."),
      ).toBeInTheDocument();
      expect(screen.getByText("Email inválido.")).toBeInTheDocument();
      expect(
        screen.getByText("Contraseña mínima 8 caracteres."),
      ).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    const aliasInput = screen.getByLabelText("Alias");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitBtn = screen.getByRole("button", { name: /Registrarse/i });

    await user.type(aliasInput, "testuser");
    await user.type(emailInput, "invalidemail");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    // Email validation happens synchronously
    expect(screen.getByText(/Email inválido/)).toBeInTheDocument();
  });

  it("enables submit button when form is valid", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    const aliasInput = screen.getByLabelText("Alias");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(aliasInput, "testuser");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    const submitBtn = screen.getByRole("button", { name: /Registrarse/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
