import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationProvider } from "../../contexts/RegistrationContext";
import { UserProvider } from "../../contexts/UserContext";
import SignUpModal from "../SignUpModal";

// Mock vent module
jest.mock("../../../util/vent", () => ({
  trigger: jest.fn(),
}));

// Parity target: legacy main/header/signUp.js — validation runs on every
// keystroke (not on submit), alias/email availability comes from check.cgi, and
// the submit button stays disabled until all three fields are valid.
const jsonResponse = (payload) => ({
  ok: true,
  headers: { get: () => "application/json; charset=utf-8" },
  arrayBuffer: async () =>
    new TextEncoder().encode(JSON.stringify(payload)).buffer,
});

const renderSignUpModal = () =>
  render(
    <UserProvider>
      <RegistrationProvider>
        <SignUpModal />
      </RegistrationProvider>
    </UserProvider>,
  );

describe("SignUpModal", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ status: "disponible" })),
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders the legacy form fields and markers", () => {
    const { container } = renderSignUpModal();

    expect(container.querySelector("form.sign-up-modal")).toBeInTheDocument();
    expect(screen.getByLabelText("Alias")).toBeInTheDocument();
    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrarse/i })).toBeDisabled();
  });

  it("rejects a short alias and a bad email as they are typed", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Alias"), "abc");
    expect(screen.getByText("Alias mu corto")).toBeInTheDocument();

    await user.type(screen.getByLabelText("email"), "invalidemail");
    expect(screen.getByText("email no vale")).toBeInTheDocument();

    // Neither triggered an availability call.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects a short password", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Password"), "short");

    expect(
      screen.getByText("password de 8 characteres al menos, porfa"),
    ).toBeInTheDocument();
  });

  it("reports an alias that is already taken", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ status: "pillado" })),
    );
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Alias"), "testuser");

    await waitFor(() => {
      expect(screen.getByText("El alias ya está pillao")).toBeInTheDocument();
    });
    // Legacy fires a check per keystroke once the alias is long enough,
    // aborting the previous one — so the last call carries the full value.
    const lastCall = global.fetch.mock.calls.at(-1)[0];
    expect(lastCall).toContain("check.cgi?indice=alias&value=testuser");
  });

  it("enables submit once alias, email and password all validate", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Alias"), "testuser");
    await user.type(screen.getByLabelText("email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /registrarse/i }),
      ).not.toBeDisabled();
    });
    expect(screen.getByText(/Alias disponible/)).toBeInTheDocument();
    expect(screen.getByText(/Email no registrado/)).toBeInTheDocument();
  });
});
