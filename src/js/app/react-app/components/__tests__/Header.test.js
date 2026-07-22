import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "../../contexts/UserContext";
import Header from "../Header";

jest.mock("../NotificacionesButton", () => () => null);
jest.mock("../LoginStatus", () => () => null);

// Parity target: legacy main/mainView-t.html + mainView.js.
describe("Header", () => {
  const renderAt = (path, head) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <UserProvider>
          <Routes>
            <Route
              path="/:foro/*"
              element={<Header head={head} onMenuClick={() => {}} />}
            />
          </Routes>
        </UserProvider>
      </MemoryRouter>,
    );

  // Regression: the logo linked to `/${currentForo}`, so on any foro other
  // than foroscomun the only "home" affordance in the header just reloaded
  // the page you were already on. Legacy binds `.js-home` to goToHome(),
  // which routes to '/' (mainView.js:104-107). Only the logo was changed —
  // the title link stays on `/${currentForo}` as before (see below).
  it("links the header logo to the site root, not the current foro", () => {
    const { container } = renderAt("/kingcrimson", {
      Titulo: "king Crimson",
      INDICE: "gritos",
    });

    expect(container.querySelector(".js-home a")).toHaveAttribute("href", "/");
  });

  // The title link is unchanged: it still points at the current foro from the
  // URL, not the site root.
  it("links the title to the current foro", () => {
    renderAt("/kingcrimson", { Titulo: "king Crimson", INDICE: "gritos" });

    expect(screen.getAllByText("king Crimson")[0].closest("a")).toHaveAttribute(
      "href",
      "/kingcrimson",
    );
  });
});
