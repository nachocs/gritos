import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import useNavGuard from "./hooks/useNavGuard";
import ForoPage from "./pages/ForoPage";
import GalleryPage from "./pages/GalleryPage";
import MensajePage from "./pages/MensajePage";
import UserListPage from "./pages/UserListPage";
import VotacionesPage from "./pages/VotacionesPage";

/**
 * Main Application Component.
 * Replaces legacy router.js definitions.
 */
const App = () => {
  // Global navigation guard for unsaved changes
  useNavGuard();

  return (
    <Routes>
      {/* Layout is a layout route (renders <Outlet/>) so its descendants —
          Header, FormShell, RightSidebar — see the matched :foro param via
          useParams(). It must not wrap <Routes> as children: that would put
          it outside any matched route and useParams() would always be {}. */}
      <Route element={<Layout />}>
        {/* Root redirect to default forum */}
        <Route path="/" element={<Navigate to="/foroscomun" replace />} />

        {/* Reserved forum names redirect to default */}
        <Route path="/admin" element={<Navigate to="/foroscomun" replace />} />
        <Route
          path="/jsgritos"
          element={<Navigate to="/foroscomun" replace />}
        />

        {/* Main Forum View */}
        <Route path="/:foro" element={<ForoPage />} />

        {/* Feature views within a forum */}
        <Route path="/:foro/gallery" element={<GalleryPage />} />
        <Route path="/:foro/votaciones" element={<VotacionesPage />} />
        <Route path="/:foro/usuarios" element={<UserListPage />} />

        {/* Message Detail */}
        <Route path="/:foro/:id" element={<MensajePage />} />
        <Route path="/:foro/:id/votaciones" element={<VotacionesPage />} />

        {/* Ciudadanos wall: legacy rendered /ciudadanos/<id> as a foro-style
            page (wall header + message list + composer), NOT a message
            detail — the static "ciudadanos" segment outranks /:foro/:id. */}
        <Route path="/ciudadanos/:id" element={<ForoPage />} />

        {/* 404 / Default fallback */}
        <Route path="*" element={<Navigate to="/foroscomun" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
