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
  // which routes to '/' (mainView.js:104-107).
  it("links the header logo to the site root, not the current foro", () => {
    const { container } = renderAt("/kingcrimson", {
      Titulo: "king Crimson",
      Name: "kingcrimson",
      INDICE: "gritos",
    });

    expect(container.querySelector(".js-home a")).toHaveAttribute("href", "/");
  });

  // The title is a separate affordance and does keep pointing at the current
  // head, matching legacy's `data-link="/<Name>"`.
  it("links the title to the current head's Name", () => {
    renderAt("/kingcrimson", {
      Titulo: "king Crimson",
      Name: "kingcrimson",
      INDICE: "gritos",
    });

    expect(screen.getAllByText("king Crimson")[0].closest("a")).toHaveAttribute(
      "href",
      "/kingcrimson",
    );
  });

  // Legacy renders `data-link="/"` when the head is foroscomun.
  it("links the title to the root on foroscomun", () => {
    renderAt("/foroscomun", {
      Titulo: "gritos.com",
      Name: "foroscomun",
      INDICE: "gritos",
    });

    expect(screen.getAllByText("gritos.com")[0].closest("a")).toHaveAttribute(
      "href",
      "/",
    );
  });
});
