import vent from "../../util/vent";

const avisosTarget = new EventTarget();

export const publishAviso = (payload) => {
  avisosTarget.dispatchEvent(
    new CustomEvent("avisos", {
      detail: payload,
    }),
  );
};

export const onAviso = (handler) => {
  const handleLocalAviso = (event) => handler(event.detail);
  avisosTarget.addEventListener("avisos", handleLocalAviso);
  vent.on("avisos", handler);

  return () => {
    avisosTarget.removeEventListener("avisos", handleLocalAviso);
    vent.off("avisos", handler);
  };
};
