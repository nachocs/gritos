/**
 * The gritos CGI backend serves every endpoint as
 * `Content-Type: application/json; charset=ISO-8859-1`, and the payloads really
 * do contain raw latin-1 bytes (e.g. 0xF3 for "ó" in a foro's INTRODUCCION).
 *
 * `Response.json()` / `Response.text()` always decode as UTF-8 regardless of
 * the declared charset, so those bytes came through as U+FFFD — "saber dónde"
 * rendered as "saber d<?>nde". Legacy didn't hit this because Backbone went
 * through jQuery/XHR, which honours the charset in the response header.
 *
 * Read the body as bytes and decode with the charset the server actually
 * declared (defaulting to UTF-8 if it stops declaring one), rather than
 * hardcoding latin-1 — so this keeps working if the backend is ever fixed.
 *
 * Message *bodies* mostly escaped this because they store accents as HTML
 * entities (&oacute;), which is why only some strings looked corrupted.
 */
const charsetFrom = (response) => {
  const match = /charset=([^;]+)/i.exec(
    response.headers.get("content-type") || "",
  );
  return (match?.[1] || "utf-8").trim().toLowerCase();
};

export const decodeBody = async (response) => {
  const buffer = await response.arrayBuffer();
  let charset = charsetFrom(response);
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    // Unknown/unsupported label — fall back rather than throwing.
    return new TextDecoder("utf-8").decode(buffer);
  }
};

/** Charset-aware replacement for `(await fetch(...)).json()`. */
export const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`request failed: ${response.status}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }
  const text = await decodeBody(response);
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export default fetchJson;
