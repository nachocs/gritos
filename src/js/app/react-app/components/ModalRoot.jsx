import { useEffect, useState } from "react";
import { closeModal, onModalClose, onModalUpdate } from "../utils/modalEvents";
import DreamysModal from "./DreamysModal";
import EditFormModal from "./EditFormModal";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";

const ModalRoot = () => {
  const [visible, setVisible] = useState(false);
  const [header, setHeader] = useState("");
  const [type, setType] = useState(null);
  const [body, setBody] = useState(null);
  const [payload, setPayload] = useState(null);
  const [action, setAction] = useState(null);
  const [hideFooter, setHideFooter] = useState(false);

  useEffect(() => {
    const handleUpdate = (updatePayload) => {
      if (!updatePayload || !updatePayload.model) {
        return;
      }
      setVisible(!!updatePayload.model.show);
      setHeader(updatePayload.model.header || "");
      if (updatePayload.signUp) {
        setType("signUp");
      } else if (updatePayload.dreamys) {
        setType("dreamys");
      } else if (updatePayload.editForm) {
        setType("editForm");
      } else if (updatePayload.login) {
        setType("login");
      } else {
        setType("default");
      }
      setBody(updatePayload.body || null);
      setPayload(updatePayload);
      setAction(updatePayload.action || null);
      setHideFooter(
        !!updatePayload.hideFooter ||
          !!updatePayload.signUp ||
          !!updatePayload.dreamys ||
          !!updatePayload.editForm ||
          !!updatePayload.login,
      );
    };

    const handleClose = () => {
      setVisible(false);
      setType(null);
      setBody(null);
      setPayload(null);
      setAction(null);
      setHideFooter(false);
    };
    const unsubscribeUpdate = onModalUpdate(handleUpdate);
    const unsubscribeClose = onModalClose(handleClose);
    return () => {
      unsubscribeUpdate();
      unsubscribeClose();
    };
  }, []);

  if (!visible) {
    return null;
  }

  const close = () => {
    setVisible(false);
    closeModal();
  };

  const runAction = () => {
    if (typeof action === "function") {
      action();
    }
    setVisible(false);
    closeModal();
  };

  const renderBody = () => {
    if (type === "signUp") {
      return <SignUpModal />;
    }
    if (type === "dreamys") {
      return (
        <DreamysModal
          uploadAvailable={payload?.uploadAvailable}
          formModel={payload?.formModel}
        />
      );
    }
    if (type === "editForm") {
      return <EditFormModal editForm={payload?.editForm} />;
    }
    if (type === "login") {
      return <LoginModal />;
    }
    return (
      <div className="modal-body">
        {body ? (
          <div dangerouslySetInnerHTML={{ __html: body }} />
        ) : (
          <p>Contenido no disponible.</p>
        )}
      </div>
    );
  };

  return (
    <div className="modal-root is-visible">
      <div className="modal-root__backdrop" onClick={close} />
      <div className="modal-root__content mdl-card mdl-shadow--4dp">
        <div className="modal-root__header">
          <h2>{header || "Modal"}</h2>
          <button type="button" className="modal-close" onClick={close}>
            ×
          </button>
        </div>
        {renderBody()}
        {!hideFooter && (
          <div className="modal-root__footer">
            <div className="btn-group" role="group" aria-label="modal actions">
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
        )}
      </div>
    </div>
  );
};

ModalRoot.propTypes = {};

export default ModalRoot;
