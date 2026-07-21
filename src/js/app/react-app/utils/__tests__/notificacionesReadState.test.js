import notificacionesReadState from "../notificacionesReadState";

jest.mock("../../../util/endpoints", () => ({
  apiUrl: "http://localhost/api/",
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

describe("notificacionesReadState", () => {
  beforeEach(() => {
    notificacionesReadState.clear();
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({})),
    );
  });

  it("fetches from index.cgi?notificaciones/<userId> on load", async () => {
    await notificacionesReadState.load("17426");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost/api/index.cgi?notificaciones/17426",
    );
  });

  it("does nothing when no user is loaded (logged out)", () => {
    notificacionesReadState.update("foro", "foroscomun", 5);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("saves via PUT with the ID merged into the body", async () => {
    global.fetch = jest.fn((url, opts) => {
      if (opts?.method === "PUT") {
        return Promise.resolve(jsonResponse({}));
      }
      return Promise.resolve(jsonResponse({ foro: "gritos/foroscomun,3" }));
    });
    await notificacionesReadState.load("17426");
    notificacionesReadState.update("foro", "foroscomun", 5);
    await Promise.resolve();
    await Promise.resolve();

    const putCall = fetch.mock.calls.find(([, opts]) => opts?.method === "PUT");
    expect(putCall).toBeDefined();
    expect(putCall[0]).toBe(
      "http://localhost/api/index.cgi?notificaciones/17426",
    );
    const body = JSON.parse(putCall[1].body);
    expect(body.ID).toBe("17426");
    expect(body.foro).toBe("gritos/foroscomun,5");
  });

  it("prefixes bare room names with gritos/ but leaves ciudadanos/ and gritos/ alone", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({})),
    );
    await notificacionesReadState.load("17426");
    notificacionesReadState.addNotificaciones([
      { tipo: "foro", room: "foroscomun", last: 1 },
      { tipo: "yo", room: "ciudadanos/17426", last: 1 },
    ]);
    expect(notificacionesReadState.state.foro).toBe("gritos/foroscomun,1");
    expect(notificacionesReadState.state.yo).toBe("ciudadanos/17426,1");
  });

  it("does not advance (or save) when the new entry is not greater", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ foro: "gritos/foroscomun,10" })),
    );
    await notificacionesReadState.load("17426");
    fetch.mockClear();
    notificacionesReadState.update("foro", "foroscomun", 5);
    expect(fetch).not.toHaveBeenCalled();
    expect(notificacionesReadState.state.foro).toBe("gritos/foroscomun,10");
  });

  it("queues updates issued before load() resolves and applies them after", async () => {
    // Matches legacy NotificacionesUserModel.runUpdate: it only ever
    // *advances* an existing watermark, never initializes a new tipo entry
    // — 'yo' is seeded server-side by the socket's prepararNotificaciones,
    // so a realistic queued update targets an already-present key.
    let resolveFetch;
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = () => resolve(jsonResponse({ yo: "1" }));
        }),
    );
    const loadPromise = notificacionesReadState.load("17426");
    notificacionesReadState.update("yo", "ciudadanos/17426", 3);
    expect(notificacionesReadState.state.yo).toBeUndefined();

    resolveFetch();
    await loadPromise;

    expect(notificacionesReadState.state.yo).toBe("3");
  });

  it("never initializes a watermark that doesn't already exist (matches legacy)", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({})),
    );
    await notificacionesReadState.load("17426");
    fetch.mockClear();
    notificacionesReadState.update("foro", "foroscomun", 5);
    expect(notificacionesReadState.state.foro).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("tracks per-subtype mola/nomola/love watermarks independently for msg", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ msg: "gritos/foroscomun/5,0/0/0" })),
    );
    await notificacionesReadState.load("17426");
    notificacionesReadState.update("msg", "foroscomun/5", 2, "mola");
    expect(notificacionesReadState.state.msg).toBe("gritos/foroscomun/5,2/0/0");
    notificacionesReadState.update("msg", "foroscomun/5", 3, "love");
    expect(notificacionesReadState.state.msg).toBe("gritos/foroscomun/5,2/0/3");
  });

  it("caps addNotificaciones history at 10 rooms per type", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({})),
    );
    await notificacionesReadState.load("17426");
    const notis = Array.from({ length: 12 }, (_, i) => ({
      tipo: "foro",
      room: `foro${i}`,
      last: i,
    }));
    notificacionesReadState.addNotificaciones(notis);
    expect(notificacionesReadState.state.foro.split("|")).toHaveLength(10);
    expect(notificacionesReadState.state.foro).toContain("gritos/foro11,11");
    expect(notificacionesReadState.state.foro).not.toContain("gritos/foro0,0");
  });

  it("clear() resets state and makes further updates a no-op", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({})),
    );
    await notificacionesReadState.load("17426");
    notificacionesReadState.clear();
    fetch.mockClear();
    notificacionesReadState.update("foro", "foroscomun", 5);
    expect(fetch).not.toHaveBeenCalled();
  });
});
