import "core-js/stable";
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
 * Render the React application.
 */
const init = () => {
  // Aqui se cargaba el SDK de Facebook y se hacia FB.init() con la Graph API
  // v2.7, de 2016: Meta la retiro hace anos, o sea que el boton de "Facebook
  // Log In/Sign Up" llevaba muchisimo sin funcionar (el comentario anterior
  // ya decia que era "a stub either way").
  //
  // No se reactiva porque Meta exige hoy vincular la app a un portfolio de
  // negocio VERIFICADO, con documentacion de una sociedad real, y la SL ya
  // no existe. Se retira tambien en dreamers.es, por lo mismo.
  //
  // Efecto colateral bueno: se va una peticion a connect.facebook.net que los
  // bloqueadores de contenido interceptan de rutina. Ya no hay tercero
  // ninguno en el arranque.
  renderApp();
};

init();
