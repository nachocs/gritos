import PageShell from "../components/PageShell";

const NotFoundPage = () => (
  <PageShell
    title="Página no encontrada"
    subtitle="La ruta solicitada no existe."
  >
    <p>Lo sentimos, no se encontró la página que buscas.</p>
  </PageShell>
);

NotFoundPage.propTypes = {};

export default NotFoundPage;
