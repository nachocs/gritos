import { useEffect, useRef, useState } from "react";
import endpoints from "../../util/endpoints";
import { useRegistration, useUser } from "../hooks/useContexts";
import { decodeBody } from "../utils/apiFetch";
import { closeModal } from "../utils/modalEvents";
import MdlTextfield from "./MdlTextfield";

// Legacy signUp.js's regexp, verbatim.
const EMAIL_REGEXP =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

/**
 * 1:1 port of legacy main/header/signUp.js + signUp.html.
 *
 * The previous React version validated only on submit and rendered invented
 * `.signup-modal`/`.modal-group`/`.modal-error` classes, none of which exist in
 * main.less — so `.sign-up-modal`, `.error-form`, `.valid-alias`,
 * `.valid-*-load` and the MDL floating labels were all dead CSS and the form
 * looked nothing like deployed. Legacy validates on every keystroke, checks
 * alias/email availability against check.cgi, and keeps the submit button
 * disabled until all three fields are valid.
 */
const SignUpModal = () => {
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Per-field: { error, valid, loading } — drives the .error-form /
  // .valid-<field> / .valid-<field>-load trio legacy toggles with `active`.
  const [fields, setFields] = useState({
    alias: {},
    email: {},
    password: {},
  });
  const [submitError, setSubmitError] = useState("");

  const { registering, register, clearError } = useRegistration();
  const { login } = useUser();

  // Legacy unsubscribes the previous check.cgi observable before firing a new
  // one, so only the latest keystroke's answer is ever applied.
  const checkControllers = useRef({});
  useEffect(
    () => () =>
      Object.values(checkControllers.current).forEach((controller) =>
        controller.abort(),
      ),
    [],
  );

  const setField = (name, state) =>
    setFields((prev) => ({ ...prev, [name]: state }));

  const checkValue = async (indice, value) => {
    checkControllers.current[indice]?.abort();
    const controller = new AbortController();
    checkControllers.current[indice] = controller;

    setField(indice, { loading: true });
    try {
      const response = await fetch(
        `${endpoints.apiUrl}check.cgi?indice=${indice}&value=${encodeURIComponent(value)}`,
        { signal: controller.signal },
      );
      const data = JSON.parse(await decodeBody(response));
      if (data.status === "disponible") {
        setField(indice, { valid: true });
      } else {
        setField(indice, { error: `El ${indice} ya está pillao` });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setField(indice, {});
      }
    }
  };

  const handleAlias = (event) => {
    const value = event.target.value;
    setAlias(value);
    if (value && value.length < 4) {
      setField("alias", { error: "Alias mu corto" });
    } else if (value) {
      checkValue("alias", value);
    } else {
      setField("alias", {});
    }
  };

  const handleEmail = (event) => {
    const value = event.target.value;
    setEmail(value);
    if (value && (value.length < 4 || !EMAIL_REGEXP.test(value))) {
      setField("email", { error: "email no vale" });
    } else if (value) {
      checkValue("email", value);
    } else {
      setField("email", {});
    }
  };

  const handlePassword = (event) => {
    const value = event.target.value;
    setPassword(value);
    if (value && value.length < 8) {
      setField("password", {
        error: "password de 8 characteres al menos, porfa",
      });
    } else if (value) {
      setField("password", { valid: true });
    } else {
      setField("password", {});
    }
  };

  const formValid =
    fields.alias.valid && fields.email.valid && fields.password.valid;

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();
    setSubmitError("");

    try {
      const result = await register(alias, email, password);
      if (result.user && result.uid) {
        login(result.uid);
      }
      closeModal();
    } catch (err) {
      setSubmitError(`error! ${err.message}`);
    }
  };

  // The three markers legacy renders under every field.
  const markers = (name, validText) => (
    <>
      <div
        className={`error-form error-${name}${fields[name].error ? " active" : ""}`}
      >
        {fields[name].error || ""}
      </div>
      <div className={`valid-${name}${fields[name].valid ? " active" : ""}`}>
        <i className="fa fa-check-circle fa-lg" aria-hidden="true" /> {validText}
      </div>
      {name !== "password" && (
        <div
          className={`valid-${name}-load${fields[name].loading ? " active" : ""}`}
        >
          <i className="fa fa-refresh fa-spin fa-lg fa-fw" />
        </div>
      )}
    </>
  );

  return (
    <form className="sign-up-modal" onSubmit={handleSubmit} noValidate>
      <MdlTextfield
        id="signupAlias"
        label="Alias"
        value={alias}
        onChange={handleAlias}
      />
      {markers("alias", "Alias disponible! Yuhuu!")}

      <MdlTextfield
        id="signupEmail"
        label="email"
        value={email}
        onChange={handleEmail}
      />
      {markers("email", "Email no registrado! Yuhuu!")}

      <MdlTextfield
        id="signupPassword"
        label="Password"
        type="password"
        value={password}
        onChange={handlePassword}
      />
      {markers("password", "Password válida!")}

      <button
        type="submit"
        className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
        id="signupSubmit"
        disabled={!formValid || registering}
      >
        registrarse
      </button>
      <div className={`error-form error-submit${submitError ? " active" : ""}`}>
        {submitError}
      </div>
      <div className={`valid-submit-load${registering ? " active" : ""}`}>
        <i className="fa fa-refresh fa-spin fa-lg fa-fw" />
      </div>
    </form>
  );
};

export default SignUpModal;
