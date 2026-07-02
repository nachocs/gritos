import { useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import UserList from "../components/UserList";
import useJsonSearch from "../hooks/useJsonSearch";
import normalizeForo from "../utils/normalizeForo";

/**
 * Route-level page for /:foro/usuarios.
 * Replaces legacy main/userList/userListView.js + userListCollection.js.
 * Legacy fetched indice=ciudadanos&encontrar=listar:<foro>, so we point
 * useJsonSearch at the "ciudadanos" indice with that same encontrar.
 */
const UserListPage = () => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const {
    data: users,
    loading,
    error,
  } = useJsonSearch({
    foro: "ciudadanos",
    encontrar: `listar:${currentForo}`,
  });

  return (
    <PageShell title="Usuarios" subtitle={`Usuarios del foro ${currentForo}`}>
      {loading && <p>Cargando usuarios…</p>}
      {error && <p>Error al cargar los usuarios.</p>}
      {!loading && !error && <UserList users={users} />}
    </PageShell>
  );
};

export default UserListPage;
