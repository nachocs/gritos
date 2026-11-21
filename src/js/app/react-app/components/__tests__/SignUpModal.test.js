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

// Turnstile double: hands out a token as soon as the widget is rendered and
// remembers what it was asked (action, resets).
const turnstileDouble = () => {
  const calls = { render: [], reset: 0 };
  window.turnstile = {
    render: (el, opts) => {
      calls.render.push(opts);
      opts.callback("TOKEN-1");
      return "w1";
    },
    reset: () => {
      calls.reset += 1;
    },
    remove: () => {},
  };
  return calls;
};

describe("SignUpModal", () => {
  const originalFetch = global.fetch;
  let turnstileCalls;

  beforeEach(() => {
    turnstileCalls = turnstileDouble();
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ status: "disponible" })),
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete window.turnstile;
  });

  it("renders the legacy form fields and markers", () => {
    const { container } = renderSignUpModal();

    expect(container.querySelector("form.sign-up-modal")).toBeInTheDocument();
    expect(screen.getByLabelText("Alias")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrarse/i })).toBeDisabled();
  });

  it("rejects a short alias and a bad email as they are typed", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Alias"), "abc");
    expect(screen.getByText("Alias mu corto")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "invalidemail");
    expect(screen.getByText("email no vale")).toBeInTheDocument();

    // Neither triggered an availability call.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("never asks check.cgi whether an email is registered", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Email"), "test@example.com");

    expect(screen.getByText(/Email con buena pinta/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects a short password", async () => {
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Contraseña"), "short");

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
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password123");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /registrarse/i }),
      ).not.toBeDisabled();
    });
    expect(screen.getByText(/Alias disponible/)).toBeInTheDocument();
    expect(screen.getByText(/Email con buena pinta/)).toBeInTheDocument();
    expect(turnstileCalls.render[0].action).toBe("registro");
  });

  it("keeps submit disabled until Turnstile hands out a token", async () => {
    window.turnstile.render = () => "w1"; // never calls back
    const user = userEvent.setup();
    renderSignUpModal();

    await user.type(screen.getByLabelText("Alias"), "testuser");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password123");

    await waitFor(() => {
      expect(screen.getByText(/Alias disponible/)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /registrarse/i })).toBeDisabled();
    expect(screen.getByText(/Comprobando que no eres un robot/)).toHaveClass(
      "active",
    );
  });

  const fillAndSubmit = async (registroAnswer) => {
    global.fetch = jest.fn((url) =>
      Promise.resolve(
        jsonResponse(
          String(url).includes("registro.cgi")
            ? registroAnswer
            : { status: "disponible" },
        ),
      ),
    );
    const user = userEvent.setup();
    renderSignUpModal();
    await user.type(screen.getByLabelText("Alias"), "testuser");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password123");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /registrarse/i }),
      ).not.toBeDisabled();
    });
    await user.click(screen.getByRole("button", { name: /registrarse/i }));
  };

  it("sends the Turnstile token and says 'check your email' instead of logging in", async () => {
    await fillAndSubmit({ status: "pendiente", email: "test@example.com" });

    await waitFor(() => {
      expect(screen.getByText(/Te hemos mandado un correo a/)).toBeInTheDocument();
    });
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    const [url, opts] = global.fetch.mock.calls.find(([u]) =>
      String(u).includes("registro.cgi"),
    );
    expect(url).toContain("registro.cgi");
    expect(opts.body.get("turnstile")).toBe("TOKEN-1");
    expect(opts.body.get("alias")).toBe("testuser");
    expect(document.cookie).not.toMatch(/city=/);
  });

  it("shows the text for an error code and asks for a fresh token", async () => {
    await fillAndSubmit({ error: "alias_cogido" });

    await waitFor(() => {
      expect(screen.getByText("error! El alias ya está pillao")).toBeInTheDocument();
    });
    expect(turnstileCalls.reset).toBe(1);
  });
});
