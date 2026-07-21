import Backbone from "backbone";
import "core-js/stable";
import loadFBSDK from "facebook-sdk-promise";
import moment from "moment";
// moment.js loads locales via a *dynamic* `require('./locale/' + name)`,
// which only works under Node's real filesystem — static bundlers (Vite/
// esbuild/webpack) can't follow it, so the 'es' locale must be imported
// explicitly here. The `moment` alias in vite.config.js additionally makes
// sure this and the bare `import moment from "moment"` above resolve to the
// exact same module instance, otherwise the locale registers on a copy
// nothing else uses.
import "moment/locale/es";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "regenerator-runtime/runtime";
import App from "./react-app/App";
import ScrollToTop from "./ScrollToTop";
import { FormProvider } from "./react-app/contexts/FormContext";
import { GlobalProvider } from "./react-app/contexts/GlobalContext";
import { NotificationsProvider } from "./react-app/contexts/NotificationsContext";
import { RegistrationProvider } from "./react-app/contexts/RegistrationContext";
import { SocketProvider } from "./react-app/contexts/SocketContext";
import { UserProvider } from "./react-app/contexts/UserContext";

// Material Design Lite's *JS* is loaded from the CDN in index.html. Its CSS is
// not: main.less imports material.light_green-red.min.css locally, the theme
// the deployed build ships.

// Application styles (was a separate webpack CSS entry; Vite bundles via the JS entry)
import "../../css/main.less";

moment.locale("es");

const proxiedSync = Backbone.sync;
Backbone.sync = (method, model, options = {}) => {
  if (!options.crossDomain) {
    options.crossDomain = true;
  }
  return proxiedSync(method, model, options);
};

const AppProviders = ({ children }) => (
  <SocketProvider>
    <UserProvider>
      <RegistrationProvider>
        <GlobalProvider>
          <NotificationsProvider>
            <FormProvider>{children}</FormProvider>
          </NotificationsProvider>
        </GlobalProvider>
      </RegistrationProvider>
    </UserProvider>
  </SocketProvider>
);

const renderApp = () => {
  const rootElement = document.getElementById("react-root");
  if (!rootElement) {
    console.warn("React root element not found");
    return;
  }

  const router = createBrowserRouter([
    {
      path: "*",
      element: (
        <AppProviders>
          <ScrollToTop />
          <App />
        </AppProviders>
      ),
    },
  ]);

  createRoot(rootElement).render(<RouterProvider router={router} />);
};

/**
 * Initialize external SDKs and render the React application.
 */
const init = () => {
  // Render first, always. This used to render immediately in development but
  // `await loadFBSDK()` first in production — so the entire app hung behind a
  // third-party script that content blockers routinely block outright. A
  // blocked `connect.facebook.net` leaves that promise unsettled rather than
  // rejected, so the `catch` never fires and production paints nothing at all.
  // Legacy (app.js) renders synchronously and lets the SDK arrive whenever;
  // nothing in the first paint needs it, and FB login is a stub either way.
  renderApp();

  loadFBSDK()
    .then((FB) => {
      FB.init({
        appId: "472185159492660",
        cookie: true,
        xfbml: true,
        version: "v2.7",
        status: true,
      });
    })
    .catch((err) => {
      console.error("Failed to load Facebook SDK:", err);
    });
};

init();
