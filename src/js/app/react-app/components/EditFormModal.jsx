import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useUser, useForm } from "../hooks/useContexts";
import { buildEmojiHtml, insertAtCursor } from "../utils/emojiHtml";
import { imageThumbs, nextImageIndex, uploadImages } from "../utils/foroApi";
import { closeModal } from "../utils/modalEvents";
import EmojisModal from "./EmojisModal";

const getInitialComment = (msg) => {
  if (!msg) {
    return "";
  }
  return (
    msg.get?.("COMMENTS") ||
    msg.COMMENTS ||
    msg.get?.("comments") ||
    msg.comments ||
    msg.get?.("INTRODUCCION") ||
    msg.INTRODUCCION ||
    ""
  );
};

const EditFormModal = ({ editForm }) => {
  const { user } = useUser();
  const { submitMessage } = useForm();
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imageAttrs, setImageAttrs] = useState({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!editForm) {
      return undefined;
    }
    const msg = editForm.msg;
    if (msg) {
      setComment(getInitialComment(msg));
      if (editForm.isHead) {
        setTitle(msg.get?.("Titulo") || msg.Titulo || "");
      }
    } else {
      setComment("");
      setTitle("");
    }
    setImageAttrs({});
    setShowEmojis(false);
    return undefined;
  }, [editForm]);

  const handleEmojiSelect = (emoji) => {
    const { value, caret } = insertAtCursor(
      textareaRef.current,
      buildEmojiHtml(emoji),
    );
    setComment(value);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(caret, caret);
      }
    });
  };

  const handleFileChange = async (event) => {
    const { files } = event.target;
    if (!files?.length) {
      return;
    }
    if (!user?.uid) {
      setError("Debes iniciar sesión para subir imágenes.");
      event.target.value = "";
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const response = await uploadImages({
        files,
        uid: user.uid,
        indexStart: nextImageIndex(imageAttrs),
      });
      setImageAttrs((prev) => ({ ...prev, ...response }));
    } catch (err) {
      setError("No se pudieron subir las imágenes. Intenta de nuevo.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const isHead = editForm?.isHead;
  const msgData = editForm?.msg;
  const modelIsGritosdb = msgData?.get?.("INDICE") === "gritosdb" || msgData?.INDICE === "gritosdb";
  const commentPlaceholder = isHead
    ? "Escribe la introducción o descripción..."
    : "Actualiza tu mensaje...";
  const thumbs = imageThumbs(imageAttrs);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!user?.uid) {
      setError("Debes iniciar sesión para guardar cambios.");
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError("El mensaje no puede estar vacío.");
      return;
    }

    if (modelIsGritosdb && !title.trim()) {
      setError("El tema necesita un título.");
      return;
    }

    setSubmitting(true);

    const saveAttrs = {
      comments: trimmedComment,
      uid: user.uid,
      tags: msgData?.tags || "",
      ...imageAttrs,
    };

    if (isHead) {
      Object.assign(saveAttrs, { isHead: 1 });
      if (modelIsGritosdb) {
        saveAttrs.Titulo = title.trim();
        saveAttrs.Name = msgData?.Name || msgData?.get?.("Name");
      } else if (msgData?.INDICE) {
        saveAttrs.foro = msgData.INDICE;
      }
    } else if (
      editForm?.collection?.id &&
      editForm.collection.id !== "foroscomun"
    ) {
      saveAttrs.foro = editForm.collection.id;
    }

    try {
      await submitMessage(saveAttrs);
      setSubmitting(false);
      closeModal();
    } catch (err) {
      setSubmitting(false);
      setError("No se pudo guardar el formulario. Intenta de nuevo.");
      console.error("Edit form error:", err);
    }
  };

  return (
    <div className="modal-body edit-form-modal">
      <form onSubmit={handleSubmit}>
        {isHead && modelIsGritosdb && (
          <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <input
              className="mdl-textfield__input"
              type="text"
              id="edit-form-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <label className="mdl-textfield__label" htmlFor="edit-form-title">
              Título
            </label>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="formularioTextArea"
          placeholder={commentPlaceholder}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={6}
        />

        {thumbs.length > 0 && (
          <div className="thumbs-place">
            {thumbs.map((thumb) => (
              <img key={thumb.key} src={thumb.src} alt="adjunto" />
            ))}
          </div>
        )}

        <div className="form-toolbar">
          <button
            type="button"
            className="emojis mdl-button mdl-js-button mdl-button--icon"
            title="Emojis"
            onClick={() => setShowEmojis((prev) => !prev)}
          >
            <i className="material-icons">insert_emoticon</i>
          </button>
          <label
            className="upload mdl-button mdl-js-button mdl-button--icon"
            title="Adjuntar imagen"
          >
            <i className="material-icons">photo_camera</i>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          {uploading && <span className="upload-status">Subiendo...</span>}
        </div>

        {showEmojis && (
          <div className="emojis-modal-place">
            <EmojisModal onSelect={handleEmojiSelect} />
          </div>
        )}

        <div className="form-submit">
          <button
            type="submit"
            className="form-submit-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
            disabled={submitting || uploading}
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
};

EditFormModal.propTypes = {
  editForm: PropTypes.shape({
    msg: PropTypes.any,
    isHead: PropTypes.bool,
    collection: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
};

export default EditFormModal;
