import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { UserContext } from "../../contexts/UserContext";
import RichComposer from "../RichComposer";

const montar = (props = {}, user = { ID: "17426", uid: "s".repeat(48) }) => {
  const ref = createRef();
  const { container } = render(
    <UserContext.Provider value={{ user }}>
      <RichComposer ref={ref} captureUrls userId={user.ID} {...props} />
    </UserContext.Provider>,
  );
  return { ref, editor: container.querySelector("[contenteditable]") };
};
const escribir = (editor, html) => {
  editor.innerHTML = html;
  fireEvent.input(editor);
};
const ok = (datos) => Promise.resolve({ status: 200, json: () => Promise.resolve(datos) });

let pedidos;
beforeEach(() => {
  pedidos = [];
  global.fetch = jest.fn((url) => {
    pedidos.push(decodeURIComponent(url.split("url=")[1]));
    return ok({ url: "https://www.example.org/final", title: "Ejemplo", description: "Una pagina", image: "https://www.example.org/i.png" });
  });
});
afterEach(() => {
  delete global.fetch;
});

describe("RichComposer: vistas previas de enlaces", () => {
  it("un enlace escrito pide su vista previa y añade la tarjeta al final del editor", async () => {
    const { editor } = montar();
    escribir(editor, "mira esto example.org/pagina");
    await waitFor(() => expect(editor.querySelector(".captured-url")).not.toBeNull());
    expect(pedidos).toEqual(["https://example.org/pagina"]);
    const tarjeta = editor.querySelector(".captured-url");
    expect(tarjeta.querySelector(".captured-url-title a").textContent).toBe("Ejemplo");
    expect(tarjeta.querySelector(".captured-url-title a").getAttribute("href")).toBe("https://www.example.org/final");
    expect(tarjeta.querySelector("img").getAttribute("src")).toBe("https://www.example.org/i.png");
  });

  it("el mismo enlace no se pide dos veces (ni mientras espera ni cuando ya tiene tarjeta)", async () => {
    const { editor } = montar();
    escribir(editor, "example.org/a");
    escribir(editor, "example.org/a y mas texto");
    await waitFor(() => expect(editor.querySelector(".captured-url")).not.toBeNull());
    escribir(editor, editor.innerHTML + " otra vez");
    expect(pedidos).toHaveLength(1);
    expect(editor.querySelectorAll(".captured-url")).toHaveLength(1);
  });

  it("una tarjeta cerrada no vuelve a pedirse", async () => {
    const { editor } = montar();
    escribir(editor, "example.org/a");
    await waitFor(() => expect(editor.querySelector(".captured-url")).not.toBeNull());
    fireEvent.click(editor.querySelector(".capture-url-close"));
    expect(editor.querySelector(".captured-url")).toBeNull();
    escribir(editor, "example.org/a otra vez");
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(pedidos).toHaveLength(1);
    expect(editor.querySelector(".captured-url")).toBeNull();
  });

  it("como mucho 5 tarjetas", async () => {
    const { editor } = montar();
    escribir(editor, [1, 2, 3, 4, 5, 6, 7].map((n) => `sitio${n}.example.com`).join(" "));
    await waitFor(() => expect(editor.querySelectorAll(".captured-url")).toHaveLength(5));
    expect(pedidos).toHaveLength(5);
  });

  it("sin captureUrls, sin sesion o sin vista previa no se añade nada ni se rompe", async () => {
    const a = montar({ captureUrls: false });
    escribir(a.editor, "example.org/a");
    const b = montar({}, { ID: "1" });
    escribir(b.editor, "example.org/a");
    expect(pedidos).toHaveLength(0);
    global.fetch = jest.fn(() => Promise.resolve({ status: 404, json: () => Promise.resolve({ error: "sin_vista_previa" }) }));
    const c = montar();
    escribir(c.editor, "example.org/a");
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(c.editor.querySelector(".captured-url")).toBeNull();
  });

  it("si el mensaje se envia o se vacia antes de que llegue la respuesta, la tarjeta tardia no aparece", async () => {
    let soltar;
    global.fetch = jest.fn(() => new Promise((resolver) => { soltar = () => resolver({ status: 200, json: () => Promise.resolve({ url: "https://example.org/a", title: "Tarde" }) }); }));
    const { editor, ref } = montar();
    escribir(editor, "example.org/a");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    act(() => ref.current.clear());
    await act(async () => { soltar(); await new Promise((r) => setTimeout(r, 20)); });
    expect(editor.querySelector(".captured-url")).toBeNull();
  });

  it("al enviar, getHtml conserva la tarjeta pero sin el boton de cerrar", async () => {
    const { editor, ref } = montar();
    escribir(editor, "example.org/a");
    await waitFor(() => expect(editor.querySelector(".captured-url")).not.toBeNull());
    const html = ref.current.getHtml();
    expect(html).toContain("captured-url");
    expect(html).not.toContain("capture-url-close");
  });
});
