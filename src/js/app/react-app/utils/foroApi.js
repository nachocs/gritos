import endpoints from "../../util/endpoints";

export const DEFAULT_HEAD = {
  Titulo: "gritos.com",
  INTRODUCCION:
    "<div>Expresa libremente y sin ningún tipo de tapujos tu opinión sobre el tema que quieras.&nbsp;</div><div><font size=\"1\">Tus opiniones serán enviadas al HQ de la C.I.A., allí harán un correcto uso de ellas.</font></div>",
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

  const response = await fetch(`${endpoints.apiUrl}json.cgi?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`json.cgi request failed: ${response.status}`);
  }

  const data = await response.json();
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

  const response = await fetch(
    `${endpoints.apiUrl}upload.cgi?sessionId=${uid}`,
    { method: "POST", body: formData, signal },
  );

  if (!response.ok) {
    throw new Error(`upload request failed: ${response.status}`);
  }

  const data = await response.json();
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

  const response = await fetch(`${endpoints.apiUrl}index.cgi?${foro}/${id}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`message request failed: ${response.status}`);
  }

  return normalizeMessage(await response.json());
};

export const fetchForumMessages = async ({ foro, init, signal }) => {
  if (!foro) {
    return [];
  }

  const params = new URLSearchParams();
  if (init) {
    params.set("init", String(init));
  }

  const query = params.toString();
  const response = await fetch(
    `${endpoints.apiUrl}index.cgi?${foro}${query ? `&${query}` : ""}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`forum messages request failed: ${response.status}`);
  }

  const data = await response.json();
  const messages = Array.isArray(data) ? data : data ? [data] : [];
  return messages.map(normalizeMessage).filter(Boolean);
};

export const fetchHead = async ({ name, signal }) => {
  if (!name) {
    return DEFAULT_HEAD;
  }

  const params = new URLSearchParams({ Name: name });
  const response = await fetch(`${endpoints.apiUrl}head.cgi?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`head request failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data || !Object.keys(data).length) {
    return { ...DEFAULT_HEAD, Name: name };
  }
  return data;
};

export const fetchResumen = async ({ signal } = {}) => {
  const response = await fetch(`${endpoints.apiUrl}resumen.cgi?`, { signal });

  if (!response.ok) {
    throw new Error(`resumen request failed: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};
