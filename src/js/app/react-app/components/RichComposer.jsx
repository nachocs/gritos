import PropTypes from "prop-types";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Ws from "../../util/Ws";
import {
  buildCapturedUrlCard,
  extractCaptureUrls,
} from "../utils/captureUrl";
import {
  insertHtmlAtRange,
  sanitizePastedText,
  saveSelection,
} from "../utils/contentEditable";
import { onCaptureUrlReply } from "../utils/socketEvents";
import Wysiwyg from "./Wysiwyg";

/**
 * Shared rich-text composer built on a contenteditable div, replacing the
 * plain <textarea> the React composers used. This fixes the long-standing bug
 * where an inserted emoji <img> showed as raw HTML instead of rendering, and
 * restores legacy behaviour: paste sanitization (tags stripped except <a>),
 * caret-preserving emoji/HTML insertion, and a selection WYSIWYG toolbar.
 *
 * Uncontrolled by design (React must not reconcile the editable subtree). The
 * host reads content through the imperative handle: getHtml/clear/insertHtml/
 * focus/isEmpty, and is told of edits via onContentChange for dirty tracking.
 */
const RichComposer = forwardRef(function RichComposer(
  {
    initialHtml = "",
    placeholder = "",
    className = "",
    submitOnEnter = false,
    onEnterSubmit,
    onContentChange,
    showWysiwyg = true,
    captureUrls = false,
    userId,
  },
  ref,
) {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const [toolbarStyle, setToolbarStyle] = useState(null);

  // URL capture state (legacy formView.capturedUrls / removedCapturedUrls):
  // which links already have a preview card, which were dismissed, and which
  // are awaiting a reply — so a burst of keystrokes doesn't re-request a URL.
  const capturedUrls = useRef({});
  const removedUrls = useRef({});
  const pendingUrls = useRef(new Set());

  // Set the initial content once; React never manages the editable children.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scan the composer text for links and request a preview for each new one
  // (legacy formView.getCaptureUrls). Capped at 5 cards, like the original.
  const scanForUrls = useCallback(() => {
    const el = editorRef.current;
    if (!captureUrls || !userId || !el) {
      return;
    }
    extractCaptureUrls(el.innerHTML).forEach((url) => {
      if (
        capturedUrls.current[url] ||
        removedUrls.current[url] ||
        pendingUrls.current.has(url) ||
        Object.keys(capturedUrls.current).length + pendingUrls.current.size >= 5
      ) {
        return;
      }
      pendingUrls.current.add(url);
      Ws.captureUrlRequest(userId, url);
    });
  }, [captureUrls, userId]);

  const reportContent = useCallback(() => {
    if (editorRef.current) {
      onContentChange?.(editorRef.current.innerHTML);
      scanForUrls();
    }
  }, [onContentChange, scanForUrls]);

  // Append a preview card when the backend replies (legacy capture_url_reply).
  useEffect(() => {
    if (!captureUrls || !userId) {
      return undefined;
    }
    return onCaptureUrlReply(userId, (data) => {
      const el = editorRef.current;
      if (!el || !data?.url) {
        return;
      }
      const dataurl = data.url.replace(/^https?:\/\//, "");
      // Only render a card for a URL *this* composer asked about. The reply
      // event is broadcast per-user, and a wall renders one composer per
      // message (11 on a busy page), so without this every reply box sprouted
      // a copy of a card for a link typed in the main composer. Legacy dodged
      // it by registering its `capture_url_reply` listener lazily, inside the
      // scan loop — a composer that never requested a URL never listened.
      if (!pendingUrls.current.has(dataurl)) {
        return;
      }
      pendingUrls.current.delete(dataurl);
      if (capturedUrls.current[dataurl] || removedUrls.current[dataurl]) {
        return;
      }
      capturedUrls.current[dataurl] = true;
      const card = buildCapturedUrlCard({
        ...(data.reply || {}),
        id: dataurl,
      });
      el.appendChild(card);
      reportContent();
    });
  }, [captureUrls, userId, reportContent]);

  // Dismiss a preview card (delegated, since the cards are raw DOM the editor
  // owns, not React-rendered children).
  const handleEditorClick = (event) => {
    const closeBtn = event.target.closest?.(".capture-url-close");
    if (!closeBtn) {
      return;
    }
    const url = closeBtn.dataset.capturedurl;
    delete capturedUrls.current[url];
    removedUrls.current[url] = true;
    closeBtn.closest(".captured-url")?.remove();
    reportContent();
  };

  const rememberSelection = useCallback(() => {
    const range = saveSelection(editorRef.current);
    if (range) {
      savedRange.current = range;
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getHtml() {
        const el = editorRef.current;
        if (!el) {
          return "";
        }
        if (!el.querySelector(".capture-url-close")) {
          return el.innerHTML;
        }
        // Legacy submitPost strips the dismiss button before posting, keeping
        // the preview card itself in the comment HTML.
        const clone = el.cloneNode(true);
        clone.querySelectorAll(".capture-url-close").forEach((n) => n.remove());
        return clone.innerHTML;
      },
      isEmpty() {
        const el = editorRef.current;
        if (!el) {
          return true;
        }
        // Ignore whitespace and empty formatting nodes; an image counts.
        if (el.querySelector("img")) {
          return false;
        }
        return el.textContent.replace(/ /g, " ").trim().length === 0;
      },
      clear() {
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        savedRange.current = null;
        capturedUrls.current = {};
        removedUrls.current = {};
        pendingUrls.current.clear();
        reportContent();
      },
      insertHtml(html) {
        const el = editorRef.current;
        if (!el) {
          return;
        }
        el.focus();
        insertHtmlAtRange(el, savedRange.current, html);
        savedRange.current = saveSelection(el);
        reportContent();
      },
      focus() {
        editorRef.current?.focus();
      },
    }),
    [reportContent],
  );

  const handlePaste = (event) => {
    event.preventDefault();
    const clipboard = event.clipboardData || window.clipboardData;
    const text = clipboard ? clipboard.getData("text/plain") : "";
    const clean = sanitizePastedText(text);
    if (document.queryCommandSupported?.("insertText")) {
      document.execCommand("insertText", false, clean);
    } else {
      document.execCommand("paste", false, clean);
    }
    reportContent();
  };

  const updateToolbar = useCallback(() => {
    rememberSelection();
    if (!showWysiwyg) {
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.toString().length < 1) {
      setToolbarStyle(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const host = editorRef.current?.closest(".mdl-card");
    if (!host) {
      return;
    }
    const hostRect = host.getBoundingClientRect();
    setToolbarStyle({
      display: "block",
      top: `${rect.top - hostRect.top - 22}px`,
      left: `${rect.left - hostRect.left}px`,
    });
  }, [rememberSelection, showWysiwyg]);

  const handleKeyDown = (event) => {
    // Legacy type:"msg" composer (replies) submits on Enter.
    if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onEnterSubmit?.();
    }
  };

  return (
    <>
      {showWysiwyg && toolbarStyle && (
        <Wysiwyg
          style={toolbarStyle}
          onExec={() => {
            reportContent();
            updateToolbar();
          }}
        />
      )}
      {/* `placeholder` must be a bare attribute, not `data-placeholder`:
          main.less draws the empty-state prompt with
          div[contenteditable="true"]:empty:before { content: attr(placeholder) }
          so with a data- prefix the selector resolved to nothing and the
          composer showed no prompt at all. */}
      <div
        ref={editorRef}
        className={`formularioTextArea on ${className}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        placeholder={placeholder}
        onInput={reportContent}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onKeyUp={updateToolbar}
        onMouseUp={updateToolbar}
        onClick={handleEditorClick}
        onBlur={rememberSelection}
      />
    </>
  );
});

RichComposer.propTypes = {
  initialHtml: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  submitOnEnter: PropTypes.bool,
  onEnterSubmit: PropTypes.func,
  onContentChange: PropTypes.func,
  showWysiwyg: PropTypes.bool,
  captureUrls: PropTypes.bool,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default RichComposer;
