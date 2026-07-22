import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";
import ResumenNav from "../ResumenNav";

jest.mock("../../hooks/useResumen", () => () => ({
  data: [],
  loading: false,
  error: null,
}));

// Response-shaped mock: the api layer decodes via arrayBuffer() + the
// declared charset (see utils/apiFetch.js), not response.json().
const jsonResponse = (payload) => ({
  ok: true,
  headers: { get: () => "application/json; charset=utf-8" },
  arrayBuffer: async () =>
    new TextEncoder().encode(JSON.stringify(payload)).buffer,
});

const renderLoggedIn = () =>
  render(
    <MemoryRouter>
      <UserContext.Provider value={{ user: { ID: "1", uid: "u1" } }}>
        <ResumenNav />
      </UserContext.Provider>
    </MemoryRouter>,
  );

// Parity target: legacy resumenView-t.html — `.nuevo-tema` itself carries
// the MDL textfield classes, wrapping a bare <form id="nuevotema"> with no
// submit button (a single-input form submits on Enter).
describe("ResumenNav — Nuevo Tema/Foro field", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders the MDL textfield classes on the field wrapper, not a plain div", () => {
    const { container } = renderLoggedIn();
    const wrapper = container.querySelector(".nuevo-tema");
    expect(wrapper).toHaveClass(
      "mdl-textfield",
      "mdl-js-textfield",
      "mdl-textfield--floating-label",
    );
    expect(wrapper.querySelector("input")).toHaveClass("mdl-textfield__input");
    expect(wrapper.querySelector("label")).toHaveClass("mdl-textfield__label");
  });

  it("has no submit button — legacy's single-input form submits on Enter", () => {
    const { container } = renderLoggedIn();
    expect(
      container.querySelector(".nuevo-tema button"),
    ).not.toBeInTheDocument();
  });

  it("shows the already-exists error in a real .mdl-textfield__error span, made visible inline", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ ID: "82", Name: "kingcrimson" })),
    );
    const { container } = renderLoggedIn();

    await userEvent.type(
      screen.getByLabelText("Nuevo Tema/Foro"),
      "kingcrimson{Enter}",
    );

    const error = await waitFor(() =>
      container.querySelector(".mdl-textfield__error"),
    );
    expect(error).toHaveTextContent("El tema kingcrimson ya existe.");
    expect(error).toHaveStyle({ visibility: "visible" });
  });
});
