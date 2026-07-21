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
          {/* Legacy renders the bare <img class="emojione"> straight into
              .emojis-modal-content and delegates the click
              ('click .emojis-modal-content .emojione'). Wrapping each one in a
              <button class="emoji-pick"> — a class with no CSS at all — meant
              every emoji picked up the browser's default button chrome: a grey
              rgb(239,239,239) fill and a 2px outset border. */}
          {list.map((emoji) => (
            <Emoji
              key={emoji.unicode}
              unicode={emoji.unicode}
              shortname={emoji.shortname}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(emoji)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(emoji)}
            />
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
