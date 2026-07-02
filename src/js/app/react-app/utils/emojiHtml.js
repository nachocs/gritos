export const EMOJIS_URL = "https://gritos.com/assets/svg/";

/**
 * Build the emojione <img> markup the backend/display expect.
 * Mirrors the string produced by legacy util/emojis.js so posted comments
 * render identically through MessageItem's dangerouslySetInnerHTML.
 */
export const buildEmojiHtml = ({ unicode, shortname }) =>
  `<img class="emojione" alt="&#x${unicode};" title="${
    shortname || ""
  }" src="${EMOJIS_URL}${unicode}.svg">`;

/**
 * Insert `text` into a textarea at the current caret/selection.
 * Returns the next value and the caret position to restore after the update.
 */
export const insertAtCursor = (textarea, text) => {
  const value = textarea?.value ?? "";
  const start = textarea?.selectionStart ?? value.length;
  const end = textarea?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + text + value.slice(end);
  return { value: next, caret: start + text.length };
};
