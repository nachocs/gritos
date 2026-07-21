// Selection/caret helpers for the contenteditable composer.
// Ported from legacy main/form/formView.js (saveSelection / restoreSelection /
// insertTextAtCursor / onPaste), decoupled from jQuery and Backbone so both
// FormShell, EditFormModal and ReplyForm can share one rich-text composer.

/** True when `node` is `container` or a descendant of it. */
function isOrContains(node, container) {
  let current = node;
  while (current) {
    if (current === container) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

/** True when the whole current selection lives inside `el`. */
export function elementContainsSelection(el) {
  if (!el || !window.getSelection) {
    return false;
  }
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    for (let i = 0; i < sel.rangeCount; ++i) {
      if (!isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Snapshot the current range when it sits inside the editor, so it can be
 * restored after focus moves to the emoji picker / toolbar. Returns null when
 * the selection is not inside `editor`.
 */
export function saveSelection(editor) {
  if (!editor || !window.getSelection) {
    return null;
  }
  const sel = window.getSelection();
  if (!sel.rangeCount) {
    return null;
  }
  const range = sel.getRangeAt(0);
  if (!isOrContains(range.commonAncestorContainer, editor)) {
    return null;
  }
  return range;
}

/** Re-select a previously saved range. */
export function restoreSelection(range) {
  if (!range || !window.getSelection) {
    return;
  }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Insert an HTML string into `editor` at `range` (or appended when there is no
 * usable range), preserving the caret just after the inserted markup. Mirrors
 * legacy insertTextAtCursor. Returns nothing; the DOM is mutated in place.
 */
export function insertHtmlAtRange(editor, range, html) {
  if (!editor) {
    return;
  }
  const usable = range && isOrContains(range.commonAncestorContainer, editor);
  if (!usable) {
    // No caret inside the editor — append, matching legacy .append(element).
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    while (tmp.firstChild) {
      editor.appendChild(tmp.firstChild);
    }
    return;
  }

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  range.deleteContents();

  const el = document.createElement("div");
  el.innerHTML = html;
  const frag = document.createDocumentFragment();
  let node;
  let lastNode;
  while ((node = el.firstChild)) {
    lastNode = frag.appendChild(node);
  }
  range.insertNode(frag);

  if (lastNode) {
    const after = range.cloneRange();
    after.setStartAfter(lastNode);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }
}

/**
 * Sanitize clipboard text the way legacy onPaste did: strip every tag except
 * anchors and neutralize inline style attributes, so pasted content can't drag
 * arbitrary markup/styles into the stored comment.
 */
export function sanitizePastedText(text) {
  if (!text) {
    return "";
  }
  const styleReplaced = text.replace(
    /(<[\w\W]*?)(style)([\w\W]*?>)/g,
    (_all, before, _style, after) => before + "style_replace" + after,
  );
  return styleReplaced.replace(/<\/?((?!a)(\w+))\s*[\w\W]*?>/g, "");
}
