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
        {/* Render foroscomun directly at "/" rather than redirecting to
            "/foroscomun": legacy's router never rewrites the address bar for
            the default forum, it stays at "/" while treating the content as
            foroscomun internally. ForoPage already defaults an absent :foro
            param to "foroscomun" via normalizeForo, so no :foro param here
            is fine. */}
        <Route path="/" element={<ForoPage />} />

        {/* "admin", "jsgritos" and bare "ciudadanos" are reserved forum names.
            Legacy's router (router.js `foro()`) only reassigns its local
            variable to foroscomun for these — it never calls navigate(), so
            the address bar stays at whatever was typed. No explicit route is
            needed here: the generic "/:foro" route below already matches
            them, and normalizeForo() maps all three to foroscomun for the
            content lookup, exactly like the "/ciudadanos/:id"-less bare
            "/ciudadanos" case already does. */}

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
