import { decode } from "html-entities";
import endpoints from "../../util/endpoints";
import { fetchJson } from "./apiFetch";

export const DEFAULT_HEAD = {
  Titulo: "gritos.com",
  INTRODUCCION:
    '<div>Expresa libremente y sin ningún tipo de tapujos tu opinión sobre el tema que quieras.&nbsp;</div><div><font size="1">Tus opiniones serán enviadas al HQ de la C.I.A., allí harán un correcto uso de ellas.</font></div>',
  INDICE: "",
  Userid: null,
  IMAGEN0_URL: null,
};

export const buildSearchIndice = (foro) => {
  if (!foro || foro === "foroscomun") {
    return null;
  }
  if (foro.match(/ciudadanos/)) {
    return foro.replace(/\/+$/, "");
  }
  return `gritos/${foro}`;
};

export const fetchJsonSearch = async ({
  indice,
  encontrar,
  max = 10,
  last,
  signal,
}) => {
  if (!indice || !encontrar) {
    return [];
  }

  const params = new URLSearchParams({
    indice,
    encontrar,
    max: String(max),
  });

  if (last) {
    params.set("last", String(last));
  }

  const data = await fetchJson(`${endpoints.apiUrl}json.cgi?${params}`, {
    signal,
  });
  return Array.isArray(data) ? data : [];
};

/**
 * Upload one or more image files for a message.
 * Ports legacy formView.upload(): posts FICHERO_IMAGEN<n> fields to upload.cgi
 * and returns the response object (IMAGEN<n>_URL / IMAGEN<n>_THUMB / Ficheros)
 * to be merged into the post payload.
 */
export const uploadImages = async ({ files, uid, indexStart = 0, signal }) => {
  if (!files || !files.length || !uid) {
    return {};
  }

  const formData = new FormData();
  Array.from(files).forEach((file, i) => {
    formData.append(`FICHERO_IMAGEN${indexStart + i}`, file);
  });

  const data = await fetchJson(
    `${endpoints.apiUrl}upload.cgi?sessionId=${uid}`,
    { method: "POST", body: formData, signal },
  );
  return data?.response || {};
};

// Count IMAGEN<n>_URL keys so the next upload continues numbering (legacy behaviour).
export const nextImageIndex = (attrs = {}) =>
  Object.keys(attrs).filter((key) => /^IMAGEN\d+_URL$/.test(key)).length;

// Extract uploaded image thumbnails (IMAGEN<n>_THUMB) for preview.
export const imageThumbs = (attrs = {}) =>
  Object.entries(attrs)
    .filter(([key]) => /^IMAGEN\d+_THUMB$/.test(key))
    .map(([key, src]) => ({ key, src }));

export const normalizeMessage = (message) => {
  if (!message || typeof message !== "object") {
    return null;
  }
  const normalized = { ...message };
  if (normalized.INDICE) {
    normalized.indice = normalized.INDICE;
  }
  if (normalized.INDICE && normalized.ID) {
    normalized.wId = `${normalized.INDICE}/${normalized.ID}`;
  }
  return normalized;
};

export const fetchMessage = async ({ foro, id, signal }) => {
  if (!foro || !id) {
    return null;
  }

  const data = await fetchJson(`${endpoints.apiUrl}index.cgi?${foro}/${id}`, {
    signal,
  });

  return normalizeMessage(data);
};

/**
 * Persist a full message entity — Backbone model.save() equivalent.
 * Legacy PUT the entire model JSON to index.cgi?<INDICE>/<ID> (used by
 * mola/nomola/love toggles and encuesta votes/open-close).
 */
export const saveMessage = async ({ message, signal }) => {
  if (!message?.INDICE || !message?.ID) {
    throw new Error("saveMessage requires INDICE and ID");
  }
  const data = await fetchJson(
    `${endpoints.apiUrl}index.cgi?${message.INDICE}/${message.ID}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal,
    },
  );
  return normalizeMessage(data);
};

/**
 * Delete a message — Backbone model.destroy() equivalent.
 */
export const deleteMessage = async ({ message, signal }) => {
  if (!message?.INDICE || !message?.ID) {
    throw new Error("deleteMessage requires INDICE and ID");
  }
  const response = await fetch(
    `${endpoints.apiUrl}index.cgi?${message.INDICE}/${message.ID}`,
    { method: "DELETE", signal },
  );
  if (!response.ok) {
    throw new Error(`message delete failed: ${response.status}`);
  }
  return true;
};

export const fetchForumMessages = async ({ foro, init, max = 20, signal }) => {
  if (!foro) {
    return [];
  }

  const params = new URLSearchParams();
  if (init) {
    params.set("init", String(init));
  }
  params.set("max", String(max));

  const query = params.toString();
  const data = await fetchJson(
    `${endpoints.apiUrl}index.cgi?${foro}${query ? `&${query}` : ""}`,
    { signal },
  );

  const messages = Array.isArray(data) ? data : data ? [data] : [];
  return messages.map(normalizeMessage).filter(Boolean);
};

export const fetchHead = async ({ name, signal }) => {
  if (!name) {
    return DEFAULT_HEAD;
  }

  // Legacy HeadModel had urlRoot "head.cgi?" + idAttribute Name, which
  // Backbone turned into `head.cgi?/<encoded name>` — the deployed app
  // provably works with that form (a `Name=` query param does not).
  const data = await fetchJson(
    `${endpoints.apiUrl}head.cgi?/${encodeURIComponent(name)}`,
    { signal },
  );

  if (!data || !Object.keys(data).length) {
    return { ...DEFAULT_HEAD, Name: name };
  }
  // `Titulo` is rendered as plain text (the header/drawer title, the
  // composer placeholder) rather than through dangerouslySetInnerHTML like
  // INTRODUCCION/comments are — so unlike those, an HTML entity in it (the
  // API returns "Japon&eacute;s a Gritos" as-is) never gets a browser HTML
  // parse to decode it. Legacy fed everything through lodash's unescaped
  // `<%= %>` into an HTML string, so this never showed there. Same trap as
  // the captured-URL card title/description (see utils/captureUrl.js).
  return data.Titulo ? { ...data, Titulo: decode(data.Titulo) } : data;
};

export const fetchResumen = async ({ signal } = {}) => {
  const data = await fetchJson(`${endpoints.apiUrl}resumen.cgi?`, { signal });
  return Array.isArray(data) ? data : [];
};
