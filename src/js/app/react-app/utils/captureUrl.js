/**
 * URL capture helpers, ported from legacy main/form/formView.js
 * (getCaptureUrls / isThisUrl) and util/displayCapturedUrl.html.
 *
 * The composer scans its plain text for links; each new capturable URL is sent
 * to the backend via Ws.captureUrlRequest, and the reply (title/image/
 * description) is rendered as a preview card appended inside the contenteditable
 * — exactly as the Backbone composer did.
 */

const EMAIL_REGEXP =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;

const URL_REGEXP =
  /\b(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9:%_+.~#?&//=]*)/gim;

// Legacy isThisUrl(): reject single-dot strings that aren't a known TLD, and
// reject facebook links (their preview never resolved server-side).
export const isCapturableUrl = (url) => {
  if (!url) {
    return false;
  }
  const dots = url.match(/\./);
  if (dots && dots.length === 1 && !url.match(/\//)) {
    const parts = url.split(".");
    const last = parts[parts.length - 1];
    if (!["com", "co", "uk", "us", "es"].includes(last)) {
      return false;
    }
  }
  if (url.match(/facebook\.com/)) {
    return false;
  }
  return true;
};

/**
 * Extract candidate URLs (protocol-stripped, deduped) from the composer HTML.
 * Mirrors legacy getCaptureUrls(): drop existing preview cards, strip tags and
 * emails, then run the URL regex; youtube links are handled by the embed path.
 */
export const extractCaptureUrls = (html) => {
  if (!html) {
    return [];
  }
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll(".captured-url").forEach((el) => el.remove());
  let content = container.innerHTML || "";
  content = content.replace(/&nbsp;/gi, " ");
  content = content.replace(/\n/gi, " ");
  content = content.replace(/<[^>]*>/gi, " ");
  content = content.replace(EMAIL_REGEXP, "");

  const matches = content.match(URL_REGEXP);
  if (!matches) {
    return [];
  }
  const seen = new Set();
  const urls = [];
  matches.forEach((raw) => {
    const url = raw.replace(/[\s\t\n<]+/gi, "").replace(/^https?:\/\//, "");
    if (!url || url.match(/youtube/) || !isCapturableUrl(url) || seen.has(url)) {
      return;
    }
    seen.add(url);
    urls.push(url);
  });
  return urls;
};

/**
 * Build the preview-card DOM appended inside the contenteditable, replacing the
 * legacy `_.template(displayCapturedUrl.html)`. `contentEditable=false` so the
 * caret can't land inside it; the close button is stripped before submit.
 */
export const buildCapturedUrlCard = ({ id, url, image, title, description }) => {
  const card = document.createElement("div");
  card.setAttribute("contenteditable", "false");
  card.className = "captured-url";
  card.dataset.capturedurlid = id;

  const close = document.createElement("div");
  close.className = "capture-url-close";
  close.dataset.capturedurl = id;
  close.textContent = "x";
  card.appendChild(close);

  const href = url || `https://${id}`;

  if (image) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    const img = document.createElement("img");
    img.src = image;
    img.title = title || href;
    link.appendChild(img);
    card.appendChild(link);
  }

  const titleDiv = document.createElement("div");
  titleDiv.className = "captured-url-title";
  const titleLink = document.createElement("a");
  titleLink.href = href;
  titleLink.target = "_blank";
  titleLink.rel = "noopener";
  titleLink.textContent = title || href;
  titleDiv.appendChild(titleLink);
  card.appendChild(titleDiv);

  if (description) {
    const desc = document.createElement("div");
    desc.className = "captured-url-description";
    desc.textContent = description;
    card.appendChild(desc);
  }

  return card;
};
