import { act, render, screen } from "@testing-library/react";
import { useForm } from "../../hooks/useContexts";
import { FormProvider } from "../FormContext";
import { NotificationsContext } from "../NotificationsContext";

jest.mock("../../../util/endpoints", () => ({
  apiUrl: "http://localhost/api/",
}));

jest.mock("../../../util/Ws", () => ({
  update: jest.fn(),
}));

// Response-shaped mock: the api layer decodes via arrayBuffer() + the declared
// charset (see utils/apiFetch.js), not response.json().
const jsonResponse = (data, { ok = true, charset = "utf-8" } = {}) => ({
  ok,
  headers: { get: () => `application/json; charset=${charset}` },
  arrayBuffer: () =>
    Promise.resolve(
      new TextEncoder().encode(JSON.stringify(data)).buffer,
    ),
});

describe("FormContext", () => {
  const addNotification = jest.fn();

  const TestComponent = ({ attrs }) => {
    const { submitMessage, success, error } = useForm();
    return (
      <div>
        <div data-testid="status">{success ? "done" : "pending"}</div>
        {error && <div data-testid="error">{error}</div>}
        <button
          data-testid="submit-btn"
          onClick={() => submitMessage(attrs).catch(() => {})}
        >
          Submit
        </button>
      </div>
    );
  };

  const renderWithNotifications = (attrs) =>
    render(
      <NotificationsContext.Provider value={{ addNotification }}>
        <FormProvider>
          <TestComponent attrs={attrs} />
        </FormProvider>
      </NotificationsContext.Provider>,
    );

  beforeEach(() => {
    addNotification.mockClear();
  });

  it("calls addNotification with foro/msg/minis entries after posting a top-level grito", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ status: "ok", mensaje: { ID: 42 } })),
    );

    renderWithNotifications({ foro: "foroscomun", comments: "hola" });
    await act(async () => {
      screen.getByTestId("submit-btn").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("done");
    expect(addNotification).toHaveBeenCalledWith([
      { tipo: "foro", room: "foroscomun", last: 42 },
      { tipo: "msg", room: "foroscomun/42", last: "0/0/0" },
      { tipo: "minis", room: "foroscomun/42", last: "0" },
    ]);
  });

  it("calls addNotification with minis/msg entries after posting a reply (minigrito)", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ status: "ok", mensaje: { ID: 7 } })),
    );

    renderWithNotifications({
      minigrito: { indice: "foroscomun", entrada: "42" },
      comments: "reply",
    });
    await act(async () => {
      screen.getByTestId("submit-btn").click();
    });

    expect(addNotification).toHaveBeenCalledWith([
      { tipo: "minis", room: "foroscomun/42", last: 7 },
      { tipo: "msg", room: "foroscomun/42/7", last: "0/0/0" },
    ]);
  });

  it("does not notify when the post fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ status: "error" })),
    );

    renderWithNotifications({ foro: "foroscomun", comments: "hola" });
    await act(async () => {
      screen.getByTestId("submit-btn").click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(addNotification).not.toHaveBeenCalled();
    expect(screen.getByTestId("error")).toBeInTheDocument();
  });
});
