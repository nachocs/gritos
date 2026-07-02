import PropTypes from "prop-types";
import { useState } from "react";
import { useRegistration, useUser } from "../hooks/useContexts";
import { closeModal } from "../utils/modalEvents";

const validateEmail = (email) => {
  const EMAIL_REGEXP =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  return EMAIL_REGEXP.test(String(email).toLowerCase());
};

const SignUpModal = () => {
  const [form, setForm] = useState({ alias: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const {
    registering,
    error: registrationError,
    register,
    clearError,
  } = useRegistration();
  const { login } = useUser();

  const validate = () => {
    const nextErrors = {};
    if (!form.alias || form.alias.length < 4) {
      nextErrors.alias = "Alias mínimo 4 caracteres.";
    }
    if (!form.email || !validateEmail(form.email)) {
      nextErrors.email = "Email inválido.";
    }
    if (!form.password || form.password.length < 8) {
      nextErrors.password = "Contraseña mínima 8 caracteres.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();

    if (!validate()) {
      return;
    }

    try {
      const result = await register(form.alias, form.email, form.password);
      // Update user context with registered user data
      if (result.user && result.uid) {
        await login(result.uid);
      }
      closeModal();
    } catch (err) {
      // Error is already set in registration context
      console.error("Registration error:", err);
    }
  };

  return (
    <form className="signup-modal" onSubmit={handleSubmit} noValidate>
      {[
        { id: "alias", type: "text" },
        { id: "email", type: "email" },
        { id: "password", type: "password" },
      ].map(({ id, type }) => (
        <div className="modal-group" key={id}>
          <label htmlFor={`signup-${id}`}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </label>
          <input
            id={`signup-${id}`}
            name={id}
            type={type}
            value={form[id]}
            onChange={handleChange}
          />
          {errors[id] && <div className="modal-error">{errors[id]}</div>}
        </div>
      ))}
      {registrationError && (
        <div className="modal-error">{registrationError}</div>
      )}
      <button
        type="submit"
        className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"
        disabled={registering}
      >
        {registering ? "Registrando…" : "Registrarse"}
      </button>
    </form>
  );
};

SignUpModal.propTypes = {
  onClose: PropTypes.func,
};

export default SignUpModal;
