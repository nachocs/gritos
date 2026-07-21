import { render, screen } from "@testing-library/react";
import { UserContext } from "../../contexts/UserContext";
import NotificacionesItem from "../NotificacionesItem";

// The server puts `citizen` at the top level of the notification payload
// (gritos-socket index.js emitNotificacion), not nested inside `entry`.
describe("NotificacionesItem", () => {
  const baseUser = { user: { ID: "17426" } };

  it("reads the actor's name from the top-level citizen field for msg/mola notifications", () => {
    const item = {
      tipo: "msg",
      subtipo: "mola",
      indice: "gritos/foroscomun/5",
      entry: { FECHA: 1700000000 },
      citizen: { alias_principal: "jajani", dreamy_principal: null },
    };

    render(
      <UserContext.Provider value={baseUser}>
        <NotificacionesItem item={item} onClick={() => {}} />
      </UserContext.Provider>,
    );

    expect(screen.getByText(/jajani/)).toBeInTheDocument();
    expect(screen.queryByText(/Alguien/)).not.toBeInTheDocument();
  });

  it("falls back to 'Alguien' when no citizen data is present", () => {
    const item = {
      tipo: "msg",
      subtipo: "love",
      indice: "gritos/foroscomun/5",
      entry: { FECHA: 1700000000 },
    };

    render(
      <UserContext.Provider value={baseUser}>
        <NotificacionesItem item={item} onClick={() => {}} />
      </UserContext.Provider>,
    );

    expect(screen.getByText(/Alguien/)).toBeInTheDocument();
  });
});
