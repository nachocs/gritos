import { decode } from "html-entities";
import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import ScrollRootContext from "../contexts/ScrollRootContext";
import { useUser } from "../hooks/useContexts";
import useHead from "../hooks/useHead";
import { openLoginMenu } from "../utils/loginMenuEvents";
import normalizeForo from "../utils/normalizeForo";
import tituloForo from "../utils/tituloForo";
import { claveForo } from "../utils/avisosApi";
import AvisosBanner from "./AvisosBanner";
import BuscadorForos from "./BuscadorForos";
import Cabecera from "./Cabecera";
import Drawer from "./Drawer";
import FichaMuro from "./FichaMuro";
import ForoAdmin from "./ForoAdmin";
import ForoDescription from "./ForoDescription";
import FormShell from "./FormShell";
import InvitaGritar from "./InvitaGritar";
import ModalRoot from "./ModalRoot";
import SeguirForoButton from "./SeguirForoButton";
import TemaToggle from "./TemaToggle";
import UserListPopup from "./UserListPopup";

// Rendered as the element of a layout <Route> wrapping every other route (see
// App.jsx), so useParams() here resolves against whichever child route
// matched. Previously this component took `children` and was rendered
// *above* <Routes> in App.jsx, which put it outside any matched route —
// useParams() there always returned {}, so Cabecera/FormShell
// (everything reading the current foro) silently behaved as if every page
// were foroscomun.
const Layout = () => {
  const mainRef = useRef(null);
  const formSectionRef = useRef(null);
  const { foro, id } = useParams();
  const { pathname } = useLocation();
  const { user } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever navigation happens (clicking a foro in the
  // resumen list, the logo, etc.) — mirrors MDL's own auto-close on link tap.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // MDL gates every responsive rule on an `is-small-screen` class that its own
  // JS toggles from a matchMedia listener:
  //   .mdl-layout.is-small-screen .mdl-layout--large-screen-only { display:none }
  //   .mdl-layout:not(.is-small-screen) .mdl-layout--small-screen-only { display:none }
  // MDL's JS never upgrades React-rendered DOM, so without this the class is
  // never applied and the breakpoint is stuck on "large" forever: the desktop
  // logo/title stay visible on mobile, every `--small-screen-only` element
  // (mobile title, the alias row in the login menu) is permanently hidden, and
  // `.is-small-screen .mdl-layout__content`'s 56px offset never kicks in.
  // 1024px is MDL's own Layout.MAX_WIDTH threshold.
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1024px)");
    const sync = (event) => setIsSmallScreen(event.matches);
    setIsSmallScreen(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  // Legacy hid the composer on the gallery view (full-width image grid).
  const isGallery = /\/gallery\/?$/.test(pathname);
  const isVotaciones = /\/votaciones\/?$/.test(pathname);
  const currentForo = normalizeForo(foro);
  // A ciudadanos wall (/ciudadanos/:id) matches with only an :id param.
  const isWall = !foro && Boolean(id);
  const esPortada = currentForo === "foroscomun" && !isWall;
  // The deployed header title bar shows the foro head's `Titulo` (e.g. "king
  // Crimson"), not the slug — same head the page itself loads, deduped by
  // useHead so this doesn't add a second head.cgi request.
  const { data: head } = useHead(isWall ? `ciudadanos/${id}/` : currentForo);
  // El titulo de la pestaña: antes todas decian «Gritos.com». Ahora el foro o el muro
  // (y la seccion si es galeria o votaciones); los titulos llegan con entidades HTML.
  useEffect(() => {
    const titulo = isWall
      ? decode(head?.Titulo || "").trim()
      : tituloForo(head?.Titulo, currentForo);
    const seccion = isGallery
      ? "Galería · "
      : isVotaciones
        ? "Votaciones · "
        : "";
    document.title =
      esPortada || !titulo
        ? "gritos.com · Grita sin cortarte un pelo"
        : `${seccion}${titulo} · gritos.com`;
  }, [head?.Titulo, esPortada, isGallery, isVotaciones, isWall, currentForo]);
  // El «+» solo baja hasta el compositor (o, sin sesion, abre el login). Mientras
  // el compositor se ve en pantalla sobra, y en movil tapaba el campo de
  // respuesta del primer hilo: se esconde. Solo se mira desde fuera, sin tocar
  // FormShell.
  const [composerVisible, setComposerVisible] = useState(false);
  useEffect(() => {
    const el = formSectionRef.current;
    // sin sesion tambien: ahi esta la invitacion a entrar (InvitaGritar)
    if (!el || typeof IntersectionObserver === "undefined") {
      setComposerVisible(false);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) =>
      setComposerVisible(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [user?.uid, isGallery]);
  // Legacy mainView.newMsg(): scroll to the composer when logged in, otherwise
  // pop the header's login menu open so the visitor can sign in first.
  const scrollToForm = useCallback(() => {
    if (!user?.uid) {
      openLoginMenu();
      return;
    }
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [user?.uid]);

  // Legacy mainView's root element is `class="main"` and a chunk of main.less
  // is scoped under it (`.main header.ciudadano` wall colour, link colours,
  // card text colour, drawer title padding, the <=680px header-row padding).
  // The previous `main-shell` class matched no CSS at all, so all of that
  // silently never applied.
  return (
    // `d26`: los estilos del rediseño (cabecera.less, bocadillos.less, vistas.less)
    <div className={`main d26${esPortada ? "" : " d26--pestanas"}`}>
      <div className="modal-view">
        <ModalRoot />
      </div>
      <div className="avisos-view">
        <AvisosBanner />
      </div>
      <UserListPopup />

      <div
        className={`mdl-layout mdl-js-layout mdl-layout--fixed-header${
          isSmallScreen ? " is-small-screen" : ""
        }`}
      >
        <Cabecera
          head={head}
          currentForo={currentForo}
          esMuro={isWall}
          base={isWall ? `ciudadanos/${id}` : currentForo}
          isGallery={isGallery}
          isVotaciones={isVotaciones}
          drawerOpen={drawerOpen}
          onMenuClick={() => setDrawerOpen((abierto) => !abierto)}
        />
        <Drawer
          open={drawerOpen}
          head={head}
          arriba={
            <BuscadorForos
              variante="cajon"
              onElegir={() => setDrawerOpen(false)}
            />
          }
        >
          <div className="cajon-tema">
            <TemaToggle />
            <span>Tema claro u oscuro</span>
          </div>
        </Drawer>
        <div
          className={`mdl-layout__obfuscator${drawerOpen ? " is-visible" : ""}`}
          onClick={() => setDrawerOpen(false)}
          role="presentation"
        />

        <ScrollRootContext.Provider value={mainRef}>
          <main className="mdl-layout__content" ref={mainRef}>
            <div className={`content${isGallery ? " content-gallery" : ""}`}>
              <ForoDescription head={head} isWall={isWall} />
              {isWall && <FichaMuro head={head} id={id} />}
              <ForoAdmin head={head} />
              <SeguirForoButton
                clave={claveForo({ foro: foro ? currentForo : undefined, id })}
                titulo={head?.Titulo}
                esMuro={isWall}
              />
              {!isGallery && (
                <div className="form-view" ref={formSectionRef}>
                  <FormShell />
                  {/* sin sesion FormShell no pinta nada: la invitacion ocupa su
                      sitio (y, por ir aqui dentro, tambien esconde el «+») */}
                  <InvitaGritar />
                </div>
              )}
              <div className="msg-list">{!isGallery && <Outlet />}</div>
              {!isGallery && (
                <button
                  className={`mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored new-msg${
                    composerVisible ? " new-msg-oculto" : ""
                  }`}
                  type="button"
                  onClick={scrollToForm}
                  aria-label={
                    user?.uid ? "Escribir un grito" : "Entra para gritar"
                  }
                  title={user?.uid ? "Escribir un grito" : "Entra para gritar"}
                >
                  <i className="material-icons" aria-hidden="true">
                    add
                  </i>
                </button>
              )}
            </div>
            {/* Legacy puts the gallery in a slot that is a *sibling* of
                `.content`, not inside it (`mainView-t.html`: `<div
                class="content">…</div><div class="gallery"></div>`, and
                `render()` replaces the placeholder with the gallery view).
                Rendering it inside `.content` clamped the tile grid to that
                element's `max-width: 800px`, so `.gallery-entry`'s `width: 30%`
                resolved against 800px instead of the full content area — a
                visibly narrower gallery than deployed. The `.content` element
                itself still renders (head card + gear), exactly as legacy. */}
            {isGallery && <Outlet />}
          </main>
        </ScrollRootContext.Provider>
      </div>
    </div>
  );
};

export default Layout;
