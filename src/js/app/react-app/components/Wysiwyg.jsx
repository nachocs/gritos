import PropTypes from "prop-types";

// Selection toolbar for the contenteditable composer.
// Port of legacy main/form/Wysiwyg.js: bold / italic / link / heading sizes /
// spoiler acting on the current selection via document.execCommand. Rendered
// (and positioned) by RichComposer, which shows it only while text is selected.

const getSelectedText = () =>
  window.getSelection ? window.getSelection().toString() : "";

const exec = (type, arg = null) => document.execCommand(type, false, arg);

const query = (type) => document.queryCommandValue(type);

const Wysiwyg = ({ style, onExec }) => {
  // Legacy guarded every text action behind a non-empty selection.
  const withSelection = (fn) => (event) => {
    event.preventDefault();
    if (getSelectedText().length === 0) {
      return;
    }
    fn();
    onExec?.();
  };

  const bold = withSelection(() => exec("bold"));
  const italic = withSelection(() => exec("italic"));
  const extraSmall = withSelection(() => exec("fontSize", 1));
  const spoiler = withSelection(() =>
    exec("insertText", `-:SPOILER[${getSelectedText()}]SPOILER:-`),
  );

  const link = withSelection(() => {
    let href = "http://";
    const parentElement = window.getSelection().focusNode?.parentElement;
    if (parentElement?.href) {
      href = parentElement.href;
    }
    exec("unlink");
    // eslint-disable-next-line no-alert
    href = window.prompt("Enter a link:", href);
    if (!href || href === "http://") {
      return;
    }
    if (!/:\/\//.test(href)) {
      href = "http://" + href;
    }
    exec("createLink", href);
  });

  const heading = (tag) => (event) => {
    event.preventDefault();
    if (query("formatBlock") === tag) {
      exec("formatBlock", "p");
    } else {
      exec("formatBlock", tag);
    }
    onExec?.();
  };

  return (
    <div className="wysiwyg" style={style}>
      <a
        href="#"
        data-type="bold"
        style={{ fontWeight: "bold" }}
        title="bold"
        onMouseDown={bold}
      >
        B
      </a>
      <a
        href="#"
        data-type="italic"
        style={{ fontStyle: "italic" }}
        title="italic"
        onMouseDown={italic}
      >
        I
      </a>
      <a
        href="#"
        data-type="link"
        style={{ textDecoration: "underline" }}
        title="link"
        onMouseDown={link}
      >
        A
      </a>
      <a href="#" data-type="h2" title="large" onMouseDown={heading("h2")}>
        XL
      </a>
      <a href="#" data-type="h3" title="medium" onMouseDown={heading("h3")}>
        M
      </a>
      <a href="#" data-type="XS" title="small" onMouseDown={extraSmall}>
        XS
      </a>
      <a href="#" data-type="spoiler" title="spoiler" onMouseDown={spoiler}>
        SP
      </a>
    </div>
  );
};

Wysiwyg.propTypes = {
  style: PropTypes.object,
  onExec: PropTypes.func,
};

export default Wysiwyg;
