import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../hooks/useContexts";
import useResumen from "../hooks/useResumen";
import { fetchHead } from "../utils/foroApi";
import { openModal } from "../utils/modalEvents";

const ResumenNav = () => {
  const { user } = useUser();
  const {
    data: resumen,
    loading,
    error,
  } = useResumen();
  const [newTopic, setNewTopic] = useState("");
  const [topicError, setTopicError] = useState("");
  const [submittingTopic, setSubmittingTopic] = useState(false);

  const normalizeTopic = (value) =>
    value.replace(/\s/gi, "_").replace(/\W/gi, "");

  const handleNewTopicSubmit = (event) => {
    event.preventDefault();
    setTopicError("");

    if (!user?.ID) {
      setTopicError("Debes iniciar sesión para crear un nuevo tema.");
      return;
    }

    const trimmed = newTopic.trim();
    if (!trimmed) {
      setTopicError("Escribe un nombre válido para el nuevo tema.");
      return;
    }

    const normalized = normalizeTopic(trimmed);
    if (!normalized || normalized.length === 0) {
      setTopicError("El nombre del tema no es válido.");
      return;
    }

    setSubmittingTopic(true);
    fetchHead({ name: normalized })
      .then((head) => {
        if (head?.ID) {
          setTopicError(`El tema ${normalized} ya existe.`);
          return;
        }

        openModal({
          model: { show: true, header: "NUEVO TEMA/FORO" },
          editForm: {
            msg: {
              ...head,
              Name: normalized,
              Userid: user.ID,
              INDICE: "gritosdb",
            },
            isHead: true,
          },
        });

        setNewTopic("");
      })
      .catch(() => {
        setTopicError("No se pudo verificar el tema. Intenta más tarde.");
      })
      .finally(() => {
        setSubmittingTopic(false);
      });
  };

  if (loading) {
    return <div className="resumen-nav">Cargando temas...</div>;
  }

  if (error) {
    return <div className="resumen-nav">Error al cargar el resumen.</div>;
  }

  return (
    <nav className="resumen-nav">
      <h3>Resumen de foros</h3>
      <h6 className="resumen-subheader">
        <Link to="/">TOP</Link>
      </h6>
      <ul>
        {resumen.length === 0 ? (
          <li>No hay temas disponibles.</li>
        ) : (
          resumen.map((item) => {
            const name = item.name || item.ID || item.id || item.nombre;
            const title = item.Titulo || item.title || name;
            const route = name
              ? `/${name.replace(/^gritos\//, "").replace(/foros\//, "")}`
              : "#";
            return (
              <li key={name || title}>
                <Link to={route}>{title}</Link>
              </li>
            );
          })
        )}
      </ul>
      {user?.ID ? (
        <div className="resumen-nav__new-topic">
          <form onSubmit={handleNewTopicSubmit}>
            <label htmlFor="nuevo-tema">Nuevo Tema/Foro</label>
            <input
              id="nuevo-tema"
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              disabled={submittingTopic}
            />
            <button type="submit" disabled={submittingTopic}>
              {submittingTopic ? "Validando..." : "Crear tema"}
            </button>
          </form>
          {topicError && <div className="resumen-nav__error">{topicError}</div>}
        </div>
      ) : (
        <div className="resumen-nav__new-topic">
          <p className="resumen-nav__new-topic-label">
            ¿Quieres un nuevo tema?
          </p>
          <p className="resumen-nav__new-topic-hint">
            Inicia sesión para proponer uno.
          </p>
        </div>
      )}
    </nav>
  );
};

export default ResumenNav;
