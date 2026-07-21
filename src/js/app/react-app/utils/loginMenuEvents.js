// Legacy mainView holds a direct reference to loginView and calls
// `this.loginView.openMenu()` from `newMsg()` when a logged-out visitor taps
// the "+" FAB. React has no such cross-component handle, so the same one-way
// signal travels over an event target, mirroring utils/modalEvents.
const loginMenuTarget = new EventTarget();

export const openLoginMenu = () => {
  loginMenuTarget.dispatchEvent(new Event("login-menu:open"));
};

export const onOpenLoginMenu = (handler) => {
  loginMenuTarget.addEventListener("login-menu:open", handler);
  return () => {
    loginMenuTarget.removeEventListener("login-menu:open", handler);
  };
};
