import { useCallback, useRef } from "react";
import PropTypes from "prop-types";
import ScrollRootContext from "../contexts/ScrollRootContext";
import AvisosBanner from "./AvisosBanner";
import Drawer from "./Drawer";
import FormShell from "./FormShell";
import Header from "./Header";
import ModalRoot from "./ModalRoot";
import RightSidebar from "./RightSidebar";
import Spinner from "./Spinner";

const Layout = ({ children }) => {
  const mainRef = useRef(null);
  const formSectionRef = useRef(null);
  const scrollToForm = useCallback(() => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  return (
    <div className="main-shell">
      <div className="spinner-view">
        <Spinner />
      </div>
      <div className="modal-view">
        <ModalRoot />
      </div>
      <div className="avisos-view">
        <AvisosBanner />
      </div>

      <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
        <Header />
        <Drawer />

        <ScrollRootContext.Provider value={mainRef}>
          <main className="mdl-layout__content" ref={mainRef}>
            <div className="right-side">
              <RightSidebar />
            </div>
            <div className="content">
              <div className="form-view" ref={formSectionRef}>
                <FormShell />
              </div>
              <div className="msg-list">
                {children}
              </div>
              <button
                className="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored new-msg"
                type="button"
                onClick={scrollToForm}
              >
                <i className="material-icons">add</i>
              </button>
            </div>
            <div className="gallery" />
          </main>
        </ScrollRootContext.Provider>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
