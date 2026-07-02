import PropTypes from "prop-types";

const EMOJIS_URL = "https://gritos.com/assets/svg/";

/**
 * Component to render an emoji image.
 */
const Emoji = ({ unicode, shortname, className }) => {
  const src = `${EMOJIS_URL}${unicode}.svg`;

  return (
    <img
      className={className || "emojione"}
      alt={`&#x${unicode};`}
      title={shortname}
      src={src}
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
