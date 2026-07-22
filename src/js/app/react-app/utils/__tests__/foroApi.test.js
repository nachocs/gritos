import { fetchHead } from "../foroApi";

// Response-shaped mock: the api layer decodes via arrayBuffer() + the
// declared charset (see utils/apiFetch.js), not response.json().
const jsonResponse = (data) => ({
  ok: true,
  headers: { get: () => "application/json; charset=utf-8" },
  arrayBuffer: () =>
    Promise.resolve(new TextEncoder().encode(JSON.stringify(data)).buffer),
});

describe("fetchHead", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Regression: head.cgi returns "Japon&eacute;s a Gritos" as-is — the API
  // doesn't decode HTML entities. Legacy fed Titulo through lodash's
  // unescaped `<%= %>` into an HTML string, so the browser decoded it while
  // parsing the markup. Titulo is rendered as plain text (Header, Drawer,
  // FormShell's placeholder) rather than through dangerouslySetInnerHTML like
  // INTRODUCCION/comments are, so it never got that free decode — the raw
  // entity showed up literally in the title bar. Same trap as the
  // captured-URL card (utils/captureUrl.js).
  it("decodes HTML entities in Titulo", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(
        jsonResponse({ Titulo: "Japon&eacute;s a Gritos", Name: "nihongo" }),
      ),
    );

    const head = await fetchHead({ name: "nihongo" });

    expect(head.Titulo).toBe("Japonés a Gritos");
  });

  it("leaves a Titulo with no entities untouched", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ Titulo: "Gothica", Name: "gothica" })),
    );

    const head = await fetchHead({ name: "gothica" });

    expect(head.Titulo).toBe("Gothica");
  });
});
