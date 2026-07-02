import { useMemo } from "react";
import emojiJson from "../../../assets/emoji_short.json";

/**
 * Hook to provide a processed and categorized list of emojis.
 * Replaces legacy Emojis class in util/emojis.js.
 */
export const useEmojis = () => {
  const emojis = useMemo(() => {
    const categorized = {};

    Object.entries(emojiJson).forEach(([name, value]) => {
      if (!categorized[value.category]) {
        categorized[value.category] = [];
      }

      categorized[value.category].push({
        unicode: value.unicode,
        shortname: value.shortname,
        name,
        aliases_ascii: value.aliases_ascii,
      });
    });

    return categorized;
  }, []);

  return emojis;
};
