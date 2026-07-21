import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import smile from "../../../../img/smile.svg";
import { useUser, useForm } from "../hooks/useContexts";
import { buildEmojiHtml } from "../utils/emojiHtml";
import { imageThumbs, nextImageIndex, uploadImages } from "../utils/foroApi";
import { closeModal } from "../utils/modalEvents";
import EmojisModal from "./EmojisModal";
import RichComposer from "./RichComposer";

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

const EditFormModal = ({ editForm, registerAction }) => {
  const { user } = useUser();
  const { submitMessage } = useForm();
  // ModalRoot unmounts this component on close, so the initial content can be
  // seeded once from the message being edited (the RichComposer is uncontrolled).
  const [initialComment] = useState(() => getInitialComment(editForm?.msg));
  const [title, setTitle] = useState(() =>
    editForm?.isHead
      ? editForm?.msg?.get?.("Titulo") || editForm?.msg?.Titulo || ""
      : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imageAttrs, setImageAttrs] = useState({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const composerRef = useRef(null);

  const handleEmojiSelect = (emoji) => {
    composerRef.current?.insertHtml(buildEmojiHtml(emoji));
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
    event?.preventDefault();
    setError(null);

    if (!user?.uid) {
      setError("Debes iniciar sesión para guardar cambios.");
      return;
    }

    const trimmedComment = (composerRef.current?.getHtml() || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .trim();
    if (!trimmedComment || composerRef.current?.isEmpty()) {
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

  // Legacy sets `this.action = EditForm.submitPost.bind(EditForm)`, so the
  // modal footer's OK is what submits — the form's own button is hidden inside
  // a modal by `.modal-body .formulario .form-submit .form-submit-button`.
  const submitRef = useRef(handleSubmit);
  submitRef.current = handleSubmit;
  useEffect(() => {
    registerAction?.(() => submitRef.current());
  }, [registerAction]);

  // Legacy injects a full `formView` into `.modal-body`, so the root here has
  // to be `.formulario` (+ `active`, since `.formulario` is `display:none` by
  // default) wrapping an inner `.mdl-card`. The previous root was
  // `.modal-body edit-form-modal`, which meant every rule this markup relies on
  // — `.file-submit`, `.emojis`, `.custom-file-upload`, `.thumbs-place` — never
  // matched, because they're all nested *inside* `.formulario` in main.less.
  // MDL's `.mdl-card` is `position:relative`, so it's also the containing block
  // the absolutely-positioned icon row is measured against.
  return (
    <div className="formulario active">
      <form onSubmit={handleSubmit}>
        <div className="mdl-card mdl-shadow--4dp">
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
        <RichComposer
          ref={composerRef}
          initialHtml={initialComment}
          placeholder={commentPlaceholder}
          captureUrls
          userId={user?.ID || user?.uid}
        />

        {thumbs.length > 0 && (
          <div className="thumbs-place">
            {thumbs.map((thumb) => (
              <img key={thumb.key} src={thumb.src} alt="adjunto" />
            ))}
          </div>
        )}

        {/* Same legacy classes the main composer uses: `.file-submit` +
            `.custom-file-upload` for the camera and a plain `.emojis` div with
            smile.svg. The `.form-toolbar` / `.upload` wrappers here had no CSS
            at all, so the icons dropped out of their absolutely-positioned row
            and picked up default button chrome. */}
        <div className="file-submit">
          <label className="custom-file-upload" title="imagen">
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
        </div>
        <div
          className="emojis"
          role="button"
          tabIndex={0}
          title="emojis"
          onClick={() => setShowEmojis((prev) => !prev)}
          onKeyDown={(e) => e.key === "Enter" && setShowEmojis((p) => !p)}
        >
          <img className="emojione" alt="😝" title="emojis" src={smile} />
        </div>
        {uploading && <span className="upload-status">Subiendo...</span>}

        <div className="form-submit">
          <button
            type="submit"
            className="form-submit-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
            disabled={submitting || uploading}
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {/* After `.form-submit`, matching legacy — otherwise the popup covers
            the emoji icon that closes it (see FormShell). */}
        {showEmojis && (
          <div className="emojis-modal-place" style={{ display: "block" }}>
            <EmojisModal onSelect={handleEmojiSelect} />
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        </div>
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
  registerAction: PropTypes.func,
};

export default EditFormModal;
