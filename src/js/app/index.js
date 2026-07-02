import Backbone from "backbone";
import "core-js/stable";
import loadFBSDK from "facebook-sdk-promise";
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

// Ensure Material Design Lite is loaded globally for its JS components
import "material-design-lite";

// Application styles (was a separate webpack CSS entry; Vite bundles via the JS entry)
import "../../css/main.less";

// Polyfill/shim for process in case build tool doesn't provide it
const isProd =
  typeof process !== "undefined" && process.env?.NODE_ENV === "production";

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
          <FormProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </FormProvider>
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
const init = async () => {
  // Render the app immediately in development for faster feedback
  // In production, we wait for critical SDKs if they affect initial render
  if (!isProd) renderApp();

  try {
    const FB = await loadFBSDK();
    FB.init({
      appId: "472185159492660",
      cookie: true,
      xfbml: true,
      version: "v2.7",
      status: true,
    });
  } catch (err) {
    console.error("Failed to load Facebook SDK:", err);
  }

  // Render the app after SDKs are initialized (or if in production)
  if (isProd) renderApp();
};

init();
