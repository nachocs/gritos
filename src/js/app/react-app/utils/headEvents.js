const headTarget = new EventTarget();

/**
 * useHead()'s fetch is only tied to `name`, and editing a foro's head
 * through the admin gear doesn't change that — so without this, every
 * consumer (Layout's title bar, ForoPage's description card, FormShell's
 * placeholder, ...) kept showing the pre-edit head until a reload. Mirrors
 * messageEvents' publishNewMessage/onNewMessage: EditFormModal already gets
 * the saved entity back from post.cgi, this just fans it out.
 */
export const publishHeadUpdate = (name, head) => {
  if (!name || !head) {
    return;
  }
  headTarget.dispatchEvent(
    new CustomEvent("head-update", { detail: { name, head } }),
  );
};

export const onHeadUpdate = (handler) => {
  const handleLocal = (event) => handler(event.detail);
  headTarget.addEventListener("head-update", handleLocal);
  return () => {
    headTarget.removeEventListener("head-update", handleLocal);
  };
};
