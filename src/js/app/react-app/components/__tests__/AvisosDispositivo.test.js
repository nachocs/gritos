import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as push from "../../utils/pushAvisos";
import AvisosDispositivo from "../AvisosDispositivo";

jest.mock("../../utils/pushAvisos");

const UID = "s".repeat(48);
const montarEstado = ({ soportado = true, permiso = "default", sub = null, ios = false, instalada = false } = {}) => {
  push.pushSoportado.mockReturnValue(soportado);
  push.esIOS.mockReturnValue(ios);
  push.instalada.mockReturnValue(instalada);
  push.suscripcionActual.mockResolvedValue(sub);
  push.resincronizar.mockResolvedValue();
  push.pedirYActivar.mockResolvedValue("activados");
  push.desactivarPush.mockResolvedValue(true);
  window.Notification = { permission: permiso };
  global.Notification = window.Notification;
};
beforeEach(() => jest.resetAllMocks());

describe("AvisosDispositivo", () => {
  it("sin avisos activados ofrece activarlos; al pulsar pide el permiso y pasa a 'activados'", async () => {
    montarEstado();
    render(<AvisosDispositivo uid={UID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Activar avisos" }));
    await screen.findByText("Avisos activados en este dispositivo.");
    expect(push.pedirYActivar).toHaveBeenCalledWith(UID);
    expect(screen.getByRole("status")).toHaveTextContent("Avisos activados en este dispositivo");
  });

  it("con avisos activados (y permiso concedido) ofrece desactivarlos y se resincroniza solo", async () => {
    montarEstado({ permiso: "granted", sub: { endpoint: "x" } });
    render(<AvisosDispositivo uid={UID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));
    await screen.findByRole("button", { name: "Activar avisos" });
    expect(push.resincronizar).toHaveBeenCalledWith(UID, { endpoint: "x" });
    expect(push.desactivarPush).toHaveBeenCalledWith(UID);
  });

  it("permiso bloqueado: lo explica y no ofrece botones", async () => {
    montarEstado({ permiso: "denied" });
    render(<AvisosDispositivo uid={UID} />);
    expect(await screen.findByText(/Has bloqueado las notificaciones/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("si la persona rechaza el permiso al pedirlo, pasa a 'bloqueado'; un fallo deja un mensaje y el boton", async () => {
    montarEstado();
    push.pedirYActivar.mockResolvedValueOnce("denegado");
    render(<AvisosDispositivo uid={UID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Activar avisos" }));
    await screen.findByText(/Has bloqueado las notificaciones/);
  });

  it("un fallo al activar no cambia el estado y avisa", async () => {
    montarEstado();
    push.pedirYActivar.mockResolvedValueOnce("error");
    render(<AvisosDispositivo uid={UID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Activar avisos" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No se han podido activar"));
    expect(screen.getByRole("button", { name: "Activar avisos" })).toBeInTheDocument();
  });

  it("iPhone sin instalar: explica como anadirla a la pantalla de inicio; sin soporte en otro sitio: no pinta nada", async () => {
    montarEstado({ soportado: false, ios: true, instalada: false });
    const { container, unmount } = render(<AvisosDispositivo uid={UID} />);
    expect(await screen.findByText(/añade gritos a la pantalla de inicio/)).toBeInTheDocument();
    unmount();
    montarEstado({ soportado: false });
    const otra = render(<AvisosDispositivo uid={UID} />);
    await waitFor(() => expect(otra.container.querySelector(".avisos-dispositivo")).toBeNull());
    expect(container).toBeDefined();
  });
});
