import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm, useUser } from "../hooks/useContexts";
import { buildEmojiHtml, insertAtCursor } from "../utils/emojiHtml";
import { imageThumbs, nextImageIndex, uploadImages } from "../utils/foroApi";
import normalizeForo from "../utils/normalizeForo";
import EmojisModal from "./EmojisModal";

/**
 * Composer for new gritos in the current foro.
 * Replaces legacy main/form/formView.js (foro post flow): comment textarea
 * plus emoji picker and image upload.
 */
const FormShell = () => {
  const { foro } = useParams();
  const currentForo = normalizeForo(foro);
  const { user } = useUser();
  const { submitMessage } = useForm();

  const textareaRef = useRef(null);
  const [comment, setComment] = useState("");
  const [imageAttrs, setImageAttrs] = useState({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    const { value, caret } = insertAtCursor(textarea, buildEmojiHtml(emoji));
    setComment(value);
    // Restore the caret just after the inserted markup.
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

  const resetForm = () => {
    setComment("");
    setImageAttrs({});
    setShowEmojis(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!user?.uid) {
      setError("Debes iniciar sesión para publicar.");
      return;
    }
    const trimmed = comment.trim();
    if (!trimmed && !Object.keys(imageAttrs).length) {
      setError("Escribe un mensaje o adjunta una imagen.");
      return;
    }

    const attrs = {
      comments: trimmed,
      uid: user.uid,
      tags: "",
      ...imageAttrs,
    };
    if (currentForo && currentForo !== "foroscomun") {
      attrs.foro = currentForo;
    }

    setSubmitting(true);
    try {
      await submitMessage(attrs);
      resetForm();
    } catch (err) {
      setError("No se pudo publicar el grito. Intenta de nuevo.");
      console.error("Form submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const thumbs = imageThumbs(imageAttrs);

  return (
    <div className="form-shell mdl-card mdl-shadow--2dp">
      <div className="mdl-card__title">
        <h2 className="mdl-card__title-text">Escribe tu grito</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mdl-card__supporting-text">
          <textarea
            ref={textareaRef}
            className="formularioTextArea mdl-textfield__input"
            rows="5"
            name="comments"
            placeholder={`Grita en ${currentForo}...`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
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

          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="mdl-card__actions mdl-card--border">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="form-submit-button mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect"
          >
            {submitting ? "Enviando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormShell;
