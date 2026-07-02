import vent from "../../util/vent";

const modalTarget = new EventTarget();

export const openModal = (payload) => {
  modalTarget.dispatchEvent(
    new CustomEvent("modal:update", {
      detail: payload,
    }),
  );
};

export const closeModal = () => {
  modalTarget.dispatchEvent(new Event("modal:close"));
};

export const onModalUpdate = (handler) => {
  const handleLocalUpdate = (event) => handler(event.detail);
  modalTarget.addEventListener("modal:update", handleLocalUpdate);
  vent.on("modal:update", handler);

  return () => {
    modalTarget.removeEventListener("modal:update", handleLocalUpdate);
    vent.off("modal:update", handler);
  };
};

export const onModalClose = (handler) => {
  modalTarget.addEventListener("modal:close", handler);
  vent.on("modal:close", handler);

  return () => {
    modalTarget.removeEventListener("modal:close", handler);
    vent.off("modal:close", handler);
  };
};
