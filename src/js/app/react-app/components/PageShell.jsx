import PropTypes from "prop-types";

const PageShell = ({ title, subtitle, children }) => (
  <section className="page-shell">
    <header className="page-shell__header">
      <h2>{title}</h2>
      {subtitle && <p className="page-shell__subtitle">{subtitle}</p>}
    </header>
    <div className="page-shell__content">{children}</div>
  </section>
);

PageShell.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
};

export default PageShell;
