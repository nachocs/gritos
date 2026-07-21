import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "../hooks/useContexts";
import { closeModal, onModalClose, onModalUpdate } from "../utils/modalEvents";
import DreamysModal from "./DreamysModal";
import EditFormModal from "./EditFormModal";
import SignUpModal from "./SignUpModal";

// 1:1 port of legacy main/modalView.js + modalView-t.html.
//
// The branch had reimplemented this shell under invented `modal-root__*` BEM
// names with a near-copy of the CSS, which lost two things that only exist in
// the legacy `.modal-back` block: the `lite` width variant (400px for simple
// modals, 600px for the edit/dreamys ones) and the `.modal-body .formulario`
// overrides — the second of which is what hides the edit form's own submit
// button so the footer's OK drives it instead. Restored to legacy's markup;
// the duplicated `.modal-root` CSS is gone.
const ModalRoot = () => {
  const { user } = useUser();
  const [visible, setVisible] = useState(false);
  const [header, setHeader] = useState("");
  const [type, setType] = useState(null);
  const [body, setBody] = useState(null);
  const [payload, setPayload] = useState(null);
  const [hideFooter, setHideFooter] = useState(false);
  // Legacy's `lite` defaults to true and is cleared for the two big modals.
  const [lite, setLite] = useState(true);
  // Legacy stores `this.action` — a plain function the OK button runs. For the
  // edit form that's the child view's `submitPost`, so the child registers it.
  const actionRef = useRef(null);

  useEffect(() => {
    const handleUpdate = (updatePayload) => {
      if (!updatePayload || !updatePayload.model) {
        return;
      }
      actionRef.current = updatePayload.action || null;
      setVisible(!!updatePayload.model.show);
      setHeader(updatePayload.model.header || "");
      setLite(!(updatePayload.editForm || updatePayload.dreamys));
      if (updatePayload.signUp) {
        setType("signUp");
      } else if (updatePayload.dreamys) {
        setType("dreamys");
      } else if (updatePayload.editForm) {
        setType("editForm");
      } else {
        setType("default");
      }
      setBody(updatePayload.body || null);
      setPayload(updatePayload);
      // Legacy hides the footer only for signUp (its own button submits).
      setHideFooter(!!updatePayload.hideFooter || !!updatePayload.signUp);
    };

    const handleClose = () => {
      setVisible(false);
      setType(null);
      setBody(null);
      setPayload(null);
      setHideFooter(false);
      setLite(true);
      actionRef.current = null;
    };
    const unsubscribeUpdate = onModalUpdate(handleUpdate);
    const unsubscribeClose = onModalClose(handleClose);
    return () => {
      unsubscribeUpdate();
      unsubscribeClose();
    };
  }, []);

  const close = () => {
    setVisible(false);
    closeModal();
  };

  const runAction = () => {
    if (typeof actionRef.current === "function") {
      actionRef.current();
    }
    close();
  };

  // Stable identity so the child's registration effect runs once, not on every
  // ModalRoot render.
  const registerAction = useCallback((fn) => {
    actionRef.current = fn;
  }, []);

  const renderBody = () => {
    if (type === "signUp") {
      return <SignUpModal />;
    }
    if (type === "dreamys") {
      // Legacy only builds the dreamys view when there's a logged-in user.
      if (!user?.uid) {
        return null;
      }
      return (
        <DreamysModal
          uploadAvailable={payload?.uploadAvailable}
          formModel={payload?.formModel}
        />
      );
    }
    if (type === "editForm") {
      return (
        <EditFormModal
          editForm={payload?.editForm}
          registerAction={registerAction}
        />
      );
    }
    return <span>{body ? <span dangerouslySetInnerHTML={{ __html: body }} /> : null}</span>;
  };

  // Legacy keeps the shell mounted and toggles `hide`, so `.modal-back`'s
  // fixed full-screen backdrop is always in the DOM.
  return (
    <div className={`modal-back${visible ? "" : " hide"}`}>
      <div className={`modal-modal${lite ? " lite" : ""} `}>
        <div className="modal-header">
          <h3>{header}</h3>
          <div
            className="modal-close js-close"
            role="button"
            tabIndex={0}
            onClick={close}
            onKeyDown={(event) => event.key === "Enter" && close()}
          >
            <i className="fa fa-times-circle fa-lg" aria-hidden="true" />
          </div>
        </div>
        <div className="modal-body">{visible ? renderBody() : null}</div>
        <div className={`modal-footer${hideFooter ? " hide" : ""}`}>
          <div className="btn-group" role="group" aria-label="...">
            <button type="button" className="btn btn-default" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-default"
              onClick={runAction}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRoot;
