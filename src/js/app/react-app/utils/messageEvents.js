const messageTarget = new EventTarget();

/**
 * Mirrors legacy formView's submitPostThrottle() success handler, which adds
 * the newly-posted message straight into the visible collection instead of
 * waiting for the socket 'updated' echo (which legacy never even requests
 * for the default foroscomun foro).
 */
export const publishNewMessage = (foro, message) => {
  if (!message) {
    return;
  }
  messageTarget.dispatchEvent(
    new CustomEvent("new-message", { detail: { foro, message } }),
  );
};

export const onNewMessage = (handler) => {
  const handleLocal = (event) => handler(event.detail);
  messageTarget.addEventListener("new-message", handleLocal);
  return () => {
    messageTarget.removeEventListener("new-message", handleLocal);
  };
};
