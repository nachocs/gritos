import PropTypes from "prop-types";

const EMOJIS_URL = "https://gritos.com/assets/svg/";

/**
 * Component to render an emoji image.
 */
// Legacy builds this markup as a raw HTML string (`alt="&#x1f600;"`), so the
// browser parses the entity and the rendered attribute ends up as the actual
// character. Passing that same string through a React prop instead makes React
// escape the ampersand, so the DOM got a literal `&amp;#x1f600;`. Resolve the
// codepoint ourselves to land on the same value deployed has. Multi-codepoint
// ids (e.g. "1f1e6-1f1e8" flags) aren't a valid single entity — legacy leaves
// those as literal text, so we do too.
const altFor = (unicode) => {
  if (/^[0-9a-f]+$/i.test(unicode)) {
    try {
      return String.fromCodePoint(parseInt(unicode, 16));
    } catch {
      /* fall through */
    }
  }
  return `&#x${unicode};`;
};

const Emoji = ({ unicode, shortname, className, ...rest }) => {
  const src = `${EMOJIS_URL}${unicode}.svg`;

  return (
    <img
      className={className || "emojione"}
      alt={altFor(unicode)}
      title={shortname}
      src={src}
      {...rest}
    />
  );
};

Emoji.propTypes = {
  unicode: PropTypes.string.isRequired,
  shortname: PropTypes.string,
  className: PropTypes.string,
};

Emoji.defaultProps = {
  shortname: "",
  className: "",
};

export default Emoji;
