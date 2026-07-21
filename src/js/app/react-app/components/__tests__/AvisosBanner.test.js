import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { publishAviso } from "../../utils/avisosEvents";
import AvisosBanner from "../AvisosBanner";

const renderBanner = () =>
  render(
    <MemoryRouter>
      <AvisosBanner />
    </MemoryRouter>,
  );

const aviso = (payload) => act(() => publishAviso(payload));

describe("AvisosBanner", () => {
  it("renders nothing before any aviso arrives", () => {
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows '1 nuevo grito' on the first arrival for a room (ID-diff baseline)", () => {
    renderBanner();
    aviso({ room: "foroscomun", entry: { ID: 42 } });
    expect(screen.getByText(/1 nuevo grito en #foroscomun/)).toBeInTheDocument();
  });

  it("counts by ID delta from the room's baseline, not by event count", () => {
    renderBanner();
    aviso({ room: "foroscomun", entry: { ID: 42 } });
    aviso({ room: "foroscomun", entry: { ID: 45 } });
    expect(screen.getByText(/4 nuevos gritos en #foroscomun/)).toBeInTheDocument();
  });

  it("ignores thread rooms (containing '/')", () => {
    const { container } = renderBanner();
    aviso({ room: "foroscomun/38603", entry: { ID: 3 } });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows only the most recently updated room, not an accumulated total", () => {
    renderBanner();
    aviso({ room: "foroscomun", entry: { ID: 42 } });
    aviso({ room: "kingcrimson", entry: { ID: 10 } });
    expect(screen.getByText(/1 nuevo grito en #kingcrimson/)).toBeInTheDocument();
    expect(screen.queryByText(/foroscomun/)).not.toBeInTheDocument();
  });

  it("strips the collection: prefix from the room name", () => {
    renderBanner();
    aviso({ room: "collection:foroscomun", entry: { ID: 5 } });
    expect(screen.getByText(/en #foroscomun/)).toBeInTheDocument();
  });

  it("clears the count when clicked", () => {
    renderBanner();
    aviso({ room: "foroscomun", entry: { ID: 42 } });
    fireEvent.click(screen.getByText(/nuevo grito/));
    expect(screen.queryByText(/nuevo grito/)).not.toBeInTheDocument();
  });
});
