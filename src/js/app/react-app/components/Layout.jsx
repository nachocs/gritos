import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import ScrollRootContext from "../contexts/ScrollRootContext";
import { useUser } from "../hooks/useContexts";
import useHead from "../hooks/useHead";
import { openLoginMenu } from "../utils/loginMenuEvents";
import normalizeForo from "../utils/normalizeForo";
import AvisosBanner from "./AvisosBanner";
import Drawer from "./Drawer";
import ForoAdmin from "./ForoAdmin";
import ForoDescription from "./ForoDescription";
import FormShell from "./FormShell";
import Header from "./Header";
import ModalRoot from "./ModalRoot";
import RightSidebar from "./RightSidebar";
import UserListPopup from "./UserListPopup";

// Rendered as the element of a layout <Route> wrapping every other route (see
// App.jsx), so useParams() here resolves against whichever child route
// matched. Previously this component took `children` and was rendered
// *above* <Routes> in App.jsx, which put it outside any matched route —
// useParams() there always returned {}, so Header/FormShell/RightSidebar
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
  // Legacy hides the sidebar entirely on foroscomun (the default/root forum)
  // but shows it on topic foros and on ciudadanos walls (/ciudadanos/:id,
  // which matches with only an :id param).
  const isWall = !foro && Boolean(id);
  // The deployed header title bar shows the foro head's `Titulo` (e.g. "king
  // Crimson"), not the slug — same head the page itself loads, deduped by
  // useHead so this doesn't add a second head.cgi request.
  const { data: head } = useHead(isWall ? `ciudadanos/${id}/` : currentForo);
  const sidebarForo = isWall
    ? `ciudadanos/${id}`
    : currentForo === "foroscomun"
      ? null
      : currentForo;
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
    <div className="main">
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
        <Header head={head} onMenuClick={() => setDrawerOpen(true)} />
        <Drawer open={drawerOpen} head={head} />
        <div
          className={`mdl-layout__obfuscator${drawerOpen ? " is-visible" : ""}`}
          onClick={() => setDrawerOpen(false)}
          role="presentation"
        />

        <ScrollRootContext.Provider value={mainRef}>
          <main className="mdl-layout__content" ref={mainRef}>
            <RightSidebar
              foro={sidebarForo}
              isGallery={isGallery}
              isVotaciones={isVotaciones}
            />
            <div className={`content${isGallery ? " content-gallery" : ""}`}>
              <ForoDescription head={head} isWall={isWall} />
              <ForoAdmin head={head} />
              {!isGallery && (
                <div className="form-view" ref={formSectionRef}>
                  <FormShell />
                </div>
              )}
              <div className="msg-list">{!isGallery && <Outlet />}</div>
              {!isGallery && (
                <button
                  className="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored new-msg"
                  type="button"
                  onClick={scrollToForm}
                >
                  <i className="material-icons">add</i>
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
