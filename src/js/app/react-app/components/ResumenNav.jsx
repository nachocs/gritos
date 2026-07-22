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
  const [topicFocused, setTopicFocused] = useState(false);

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

  // Deployed strips the gritos//foros/ prefix for BOTH display and route
  // (resumenItemView serializer + data-link). resumen.cgi returns
  // { name: "gritos/kingcrimson" }; the drawer shows "kingcrimson" → /kingcrimson.
  const shortName = (name) =>
    String(name || "")
      .replace(/^gritos\//, "")
      .replace(/^foros\//, "");

  return (
    <nav className="mdl-navigation resumen-collection">
      <h6 className="resumen-subheader">
        <Link to="/">TOP</Link>
      </h6>
      <div className="resumen-collection-view">
        {loading && <span className="mdl-navigation__link">Cargando…</span>}
        {error && (
          <span className="mdl-navigation__link">Error al cargar el resumen.</span>
        )}
        {!loading &&
          !error &&
          resumen.map((item) => {
            const name = shortName(item.name || item.value || item.ID);
            if (!name) {
              return null;
            }
            return (
              <Link
                key={name}
                className="mdl-navigation__link"
                to={`/${name}`}
              >
                {item.Titulo || name}
              </Link>
            );
          })}
      </div>
      {user?.ID && (
        // Legacy (resumenView-t.html): `.nuevo-tema` itself carries the MDL
        // textfield classes, wrapping a <form id="nuevotema"> that holds the
        // input/label/error. It had none of the MDL classes here at all —
        // is-focused/is-dirty reproduce MDL's own JS, which never upgrades
        // React-rendered DOM. There's no submit button in legacy: a
        // single-input form submits on Enter, so none is rendered here either.
        <div
          className={`nuevo-tema mdl-textfield mdl-js-textfield mdl-textfield--floating-label${
            topicFocused ? " is-focused" : ""
          }${newTopic ? " is-dirty" : ""}`}
        >
          <form id="nuevotema" onSubmit={handleNewTopicSubmit}>
            <input
              className="mdl-textfield__input"
              id="nuevo-tema"
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onFocus={() => setTopicFocused(true)}
              onBlur={() => setTopicFocused(false)}
              disabled={submittingTopic}
            />
            <label className="mdl-textfield__label" htmlFor="nuevo-tema">
              Nuevo Tema/Foro
            </label>
            <span
              className="mdl-textfield__error"
              style={topicError ? { visibility: "visible" } : undefined}
            >
              {topicError}
            </span>
          </form>
        </div>
      )}
      <a
        className="resumen-collection__legal"
        href="https://dreamers.es/web1/globalbar/copyright/p/web1/home.html"
        target="_blank"
        rel="noreferrer"
      >
        privacidad / legal
      </a>
    </nav>
  );
};

export default ResumenNav;
