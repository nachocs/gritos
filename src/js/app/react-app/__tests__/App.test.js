import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import App from "../App";
import { FormContext } from "../contexts/FormContext";

// Layout and every page pull in contexts (useUser, useHead, sockets, live
// fetches) that aren't the point of this test — only App's route table is.
// Stubbed down to "what pathname matched", so the assertions read directly
// off the URL react-router settled on.
jest.mock("../components/Layout", () => () => {
  const { Outlet: RouterOutlet } = require("react-router-dom");
  return <RouterOutlet />;
});
const stubPage = (name) => {
  const Stub = () => {
    const { useLocation } = require("react-router-dom");
    return <div data-testid={name}>{useLocation().pathname}</div>;
  };
  return Stub;
};
jest.mock("../pages/ForoPage", () => stubPage("foro-page"));
jest.mock("../pages/GalleryPage", () => stubPage("gallery-page"));
jest.mock("../pages/MensajePage", () => stubPage("mensaje-page"));
jest.mock("../pages/UserListPage", () => stubPage("userlist-page"));
jest.mock("../pages/VotacionesPage", () => stubPage("votaciones-page"));

// useNavGuard's useBlocker() only works under a data router — mirrors how
// index.js actually sets one up (createBrowserRouter), rather than the plain
// <MemoryRouter> most other component tests use.
const renderAt = (path) => {
  const router = createMemoryRouter([{ path: "*", element: <App /> }], {
    initialEntries: [path],
  });
  return render(
    <FormContext.Provider value={{ isDirty: false }}>
      <RouterProvider router={router} />
    </FormContext.Provider>,
  );
};

// Legacy's router (router.js `foro()`) reassigns admin/jsgritos/ciudadanos to
// foroscomun only for content lookup — it never calls navigate(), so the
// address bar stays exactly as typed. The branch used to force a client-side
// redirect to "/foroscomun" for "/" (and, previously, for "/admin" and
// "/jsgritos" too), rewriting the URL in a way the deployed app never does.
describe("App routing — reserved forum names", () => {
  it.each(["/", "/admin", "/jsgritos"])(
    "renders ForoPage at %s without rewriting the URL",
    (path) => {
      renderAt(path);
      expect(screen.getByTestId("foro-page")).toHaveTextContent(path);
    },
  );
});

// Legacy's catch-all route regex (router.js defaultRoute:
// /^\/?(\w+)\/(\d+)\/?/) only ever captures the first two path segments — a
// path like /ciudadanos/1/251 resolves foro="ciudadanos", entrada="1" and
// silently drops "/251", landing on the *wall*, not a message-251 detail view
// (verified live: /ciudadanos/1/251 renders identically to /ciudadanos/1 on
// the deployed site). Nothing previously matched a 3+ segment
// /ciudadanos/:id/* path, so it fell through to the catch-all and bounced to
// /foroscomun instead.
describe("App routing — ciudadanos wall sub-paths", () => {
  it.each(["/ciudadanos/1/251", "/ciudadanos/1/251/", "/ciudadanos/1/anything"])(
    "renders ForoPage (the wall) at %s instead of redirecting home",
    (path) => {
      renderAt(path);
      expect(screen.getByTestId("foro-page")).toHaveTextContent(path);
    },
  );
});
