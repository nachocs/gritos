import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FichaMuro, { desdeCuando, nombreNivel } from "../FichaMuro";
import { useUser } from "../../hooks/useContexts";
import useJsonSearch from "../../hooks/useJsonSearch";
import { abrirEdicionForo } from "../ForoAdmin";

jest.mock("../../hooks/useContexts");
jest.mock("../../hooks/useJsonSearch");
jest.mock("../ForoAdmin", () => ({
  ...jest.requireActual("../ForoAdmin"),
  abrirEdicionForo: jest.fn(),
}));

// La ficha del ciudadano encima de su muro: los datos publicos que manda head.cgi.
const HEAD = {
  INDICE: "ciudadanos",
  ID: "1",
  Titulo: "Nacho",
  nivel: "10",
  puntos: "24553",
  fecha_registro: "12-04-2001",
};

const pintar = (yo) => {
  useUser.mockReturnValue({ user: yo });
  return render(
    <MemoryRouter>
      <FichaMuro head={HEAD} id="1" />
    </MemoryRouter>,
  );
};

describe("FichaMuro", () => {
  beforeEach(() => {
    useJsonSearch.mockReturnValue({
      data: [
        { ID: "10", IMAGEN1_URL: "a.jpg" },
        { ID: "11", IMAGEN0_THUMB: "b.jpg" },
        { ID: "12" },
      ],
    });
  });

  it("numero, alias, nivel con su nombre, desde cuando y puntos", () => {
    pintar(null);
    expect(screen.getByText("Ciudadano dreamers n.º 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nacho" })).toBeInTheDocument();
    expect(screen.getByText("webmaster de dreamers")).toBeInTheDocument();
    expect(screen.getByText("desde abril de 2001")).toBeInTheDocument();
    expect(screen.getByText("24.553 puntos")).toBeInTheDocument();
    expect(screen.getByText("Su ficha en dreamers.es")).toHaveAttribute(
      "href",
      "https://dreamers.es/ciudad/ciudadanos/1",
    );
  });

  it("sus ultimas imagenes (solo las que tienen imagen) y el enlace a la galeria", () => {
    const { container } = pintar(null);
    expect(container.querySelectorAll(".ficha-muro-imagenes img")).toHaveLength(
      2,
    );
    expect(screen.getByText("Ver toda su galería")).toHaveAttribute(
      "href",
      "/ciudadanos/1/gallery",
    );
  });

  it("«Edita tu muro» solo para el dueño", () => {
    pintar({ ID: "17426", nivel: "1" });
    expect(screen.queryByText("Edita tu muro")).toBeNull();
  });

  it("el dueño lo ve y abre el editor del muro", () => {
    pintar({ ID: "1", nivel: "10" });
    screen.getByText("Edita tu muro").click();
    expect(abrirEdicionForo).toHaveBeenCalledWith(HEAD);
    expect(screen.getByText("Tu ficha en dreamers.es")).toBeInTheDocument();
  });
});

describe("nombreNivel y desdeCuando", () => {
  it("los niveles de dreamers.es; sin nivel, dormido", () => {
    expect(nombreNivel("1")).toBe("ciudadano activo");
    expect(nombreNivel("6")).toBe("presidente de región");
    expect(nombreNivel("")).toBe("ciudadano dormido");
    expect(nombreNivel(undefined)).toBe("ciudadano dormido");
  });

  it("dd-mm-aaaa a «mes de año»; lo demas, nada", () => {
    expect(desdeCuando("30-03-2006")).toBe("marzo de 2006");
    expect(desdeCuando("2006-03-30")).toBeNull();
    expect(desdeCuando("12-13-2001")).toBeNull();
    expect(desdeCuando(undefined)).toBeNull();
  });
});
