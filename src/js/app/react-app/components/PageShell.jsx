import PropTypes from "prop-types";

// The deployed app has no per-page heading on any content surface — a foro's
// identity lives in the fixed header title bar and in the foro-description
// head card, not in an <h2> above the feed. So the header only renders when a
// caller explicitly asks for one (React-only surfaces like 404), never on the
// foro / wall / gallery / votaciones / mensaje pages.
const PageShell = ({ title, subtitle, children }) => (
  <section className="page-shell">
    {title && (
      <header className="page-shell__header">
        <h2>{title}</h2>
        {subtitle && <p className="page-shell__subtitle">{subtitle}</p>}
      </header>
    )}
    <div className="page-shell__content">{children}</div>
  </section>
);

PageShell.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
};

export default PageShell;
