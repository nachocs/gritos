import PropTypes from "prop-types";
import { useState } from "react";
import Emoji from "../../util/Emoji";
import { useEmojis } from "../../util/useEmojis";

// Categories the legacy emoji modal hid from the tab bar.
const HIDDEN_CATEGORIES = new Set(["modifier", "regional"]);

/**
 * Emoji picker. Replaces legacy main/form/emojisModal.js.
 * Renders category tabs + the emojis of the active category; clicking one
 * calls onSelect(emoji) so the host form can insert it.
 */
const EmojisModal = ({ onSelect }) => {
  const emojis = useEmojis();
  const categories = Object.keys(emojis).filter(
    (category) => !HIDDEN_CATEGORIES.has(category),
  );
  const [selectedCategory, setSelectedCategory] = useState(
    categories.includes("people") ? "people" : categories[0],
  );
  const list = emojis[selectedCategory] || [];

  return (
    <div className="emojis-modal">
      <div className="emojis-modal-body">
        <div className="emojis-modal-tabs">
          {categories.map((category) => {
            const sample = emojis[category][0];
            return (
              <span
                key={category}
                className={`emoji-tab ${
                  category === selectedCategory ? "active" : ""
                }`}
                title={category}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCategory(category)}
              >
                <Emoji unicode={sample.unicode} shortname={sample.shortname} />
              </span>
            );
          })}
        </div>
        <div className="emojis-modal-content">
          {list.map((emoji) => (
            <button
              key={emoji.unicode}
              type="button"
              className="emoji-pick"
              title={emoji.shortname}
              onClick={() => onSelect(emoji)}
            >
              <Emoji unicode={emoji.unicode} shortname={emoji.shortname} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

EmojisModal.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default EmojisModal;
