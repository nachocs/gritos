import { useUser } from "../hooks/useContexts";
import { openLoginMenu } from "../utils/loginMenuEvents";
import { openModal } from "../utils/modalEvents";

// Sin sesion no hay compositor (FormShell no pinta nada) y el foro parecia de solo
// lectura: esta tarjeta ocupa su sitio e invita a entrar o a registrarse. Va al lado
// de FormShell, sin tocarlo. Mientras se comprueba la cookie (`loading`) no sale,
// para no ensenarsela un instante a quien si tiene sesion.
const InvitaGritar = () => {
  const { user, loading } = useUser();
  if (loading || user?.uid) return null;

  const registrarse = () =>
    openModal({
      model: { show: true, header: "Regístrate" },
      signUp: true,
    });

  return (
    <section className="invita-gritar" aria-label="Entra para gritar">
      <p className="invita-gritar__texto">
        <strong>¿Tienes algo que gritar?</strong>
        <span>Entra para escribir, responder y dar molas.</span>
      </p>
      <div className="invita-gritar__botones">
        <button
          type="button"
          className="invita-gritar__entrar"
          onClick={openLoginMenu}
        >
          Entrar
        </button>
        <button
          type="button"
          className="invita-gritar__registro"
          onClick={registrarse}
        >
          Regístrate
        </button>
      </div>
    </section>
  );
};

export default InvitaGritar;
