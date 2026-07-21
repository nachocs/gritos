import { decodeBody, fetchJson } from "../apiFetch";

// Build a Response-shaped object whose body is real bytes in a given encoding.
const rawResponse = (bytes, charset, { ok = true } = {}) => ({
  ok,
  headers: {
    get: () =>
      charset ? `application/json; charset=${charset}` : "application/json",
  },
  arrayBuffer: () => Promise.resolve(new Uint8Array(bytes).buffer),
});

// "dónde" with the ó as a single latin-1 byte (0xF3) — exactly what the gritos
// CGI backend serves. Decoding this as UTF-8 yields U+FFFD.
const LATIN1_DONDE = [0x64, 0xf3, 0x6e, 0x64, 0x65];

describe("apiFetch", () => {
  it("decodes ISO-8859-1 bodies using the declared charset", async () => {
    const text = await decodeBody(rawResponse(LATIN1_DONDE, "ISO-8859-1"));
    expect(text).toBe("dónde");
  });

  it("would mangle those same bytes as UTF-8 (regression guard)", async () => {
    const text = await decodeBody(rawResponse(LATIN1_DONDE, "utf-8"));
    expect(text).toContain("�");
    expect(text).not.toBe("dónde");
  });

  it("defaults to UTF-8 when no charset is declared", async () => {
    const utf8 = [...new TextEncoder().encode("dónde")];
    expect(await decodeBody(rawResponse(utf8, null))).toBe("dónde");
  });

  it("falls back to UTF-8 for an unknown charset label", async () => {
    const utf8 = [...new TextEncoder().encode("hola")];
    expect(await decodeBody(rawResponse(utf8, "definitely-not-a-charset"))).toBe(
      "hola",
    );
  });

  it("fetchJson parses latin-1 JSON payloads with accents intact", async () => {
    const json = '{"INTRODUCCION":"saber dónde"}';
    const bytes = [...json].map((c) => c.charCodeAt(0)); // latin-1 bytes
    global.fetch = jest.fn(() =>
      Promise.resolve(rawResponse(bytes, "ISO-8859-1")),
    );
    await expect(fetchJson("/head.cgi")).resolves.toEqual({
      INTRODUCCION: "saber dónde",
    });
  });

  it("fetchJson throws with the status on a failed request", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(rawResponse([], "utf-8", { ok: false })),
    );
    await expect(fetchJson("/head.cgi")).rejects.toThrow(/request failed/);
  });
});
