import PropTypes from "prop-types";
import { useState } from "react";

/**
 * Multi-foro tag editor. Port of legacy formView tag handling (toggleTags /
 * inputTag / deleteTag): up to 5 tags, each entered as word characters (max 10
 * chars, min 3), stored "#"-prefixed and comma-joined. Enter or comma commits
 * the current input. Controlled: `tags` is the comma-joined string, changes are
 * reported through onChange.
 */
// `open`/`onToggleOpen` are controlled by the parent because legacy makes the
// tag list and the emoji picker mutually exclusive: toggleTags() calls
// showEmojisIn(false) and showEmojis() calls toggleTagsIn(false).
const TagsEditor = ({ tags, onChange, open, onToggleOpen }) => {
  const [draft, setDraft] = useState("");
  const list = tags ? tags.split(",").filter(Boolean) : [];

  const commit = () => {
    let clean = draft.replace(/\W/gi, "");
    if (clean.length <= 2) {
      return;
    }
    clean = "#" + clean;
    if (list.includes(clean) || list.length >= 5) {
      setDraft("");
      return;
    }
    onChange([...list, clean].join(","));
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    }
  };

  const deleteTag = (index) => {
    onChange(list.filter((_tag, i) => i !== index).join(","));
  };

  return (
    <div className="tags-place" title="grita en varios foros">
      <i
        className="material-icons show-tags"
        role="button"
        tabIndex={0}
        onClick={onToggleOpen}
        onKeyDown={(e) => e.key === "Enter" && onToggleOpen()}
      >
        label_outline
      </i>
      <ul style={{ display: open ? "block" : "none" }}>
        {list.map((tag, index) => (
          <li key={tag}>
            <span className="mdl-chip mdl-chip--deletable">
              <span className="mdl-chip__text">{tag}</span>
              <button
                type="button"
                className="mdl-chip__action"
                onClick={() => deleteTag(index)}
              >
                <i className="material-icons">cancel</i>
              </button>
            </span>
          </li>
        ))}
        {list.length < 5 && (
          <li>
            <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
              <input
                className="mdl-textfield__input input-tag"
                type="text"
                maxLength={10}
                value={draft}
                placeholder="Foros"
                onChange={(event) =>
                  setDraft(event.target.value.replace(/\W/gi, ""))
                }
                onKeyDown={handleKeyDown}
              />
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

TagsEditor.propTypes = {
  tags: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  open: PropTypes.bool,
  onToggleOpen: PropTypes.func.isRequired,
};

TagsEditor.defaultProps = {
  open: false,
};

export default TagsEditor;
