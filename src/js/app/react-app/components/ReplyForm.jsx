import PropTypes from "prop-types";
import { useRef, useState } from "react";
import smile from "../../../../img/smile.svg";
import { useForm, useUser } from "../hooks/useContexts";
import { buildEmojiHtml } from "../utils/emojiHtml";
import {
  imageThumbs,
  nextImageIndex,
  normalizeMessage,
  uploadImages,
} from "../utils/foroApi";
import EmojisModal from "./EmojisModal";
import RichComposer from "./RichComposer";

/**
 * Reply composer under a message's comment thread.
 * Port of legacy formView with type "msg": posts a `minigrito` payload
 * ({indice, entrada} of the parent) and submits on Enter.
 */
const ReplyForm = ({ parent, onPosted }) => {
  const { user } = useUser();
  const { submitMessage } = useForm();
  const composerRef = useRef(null);
  const [imageAttrs, setImageAttrs] = useState({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Legacy only renders the reply form for logged-in users.
  if (!user?.uid) {
    return null;
  }

  const handleEmojiSelect = (emoji) => {
    composerRef.current?.insertHtml(buildEmojiHtml(emoji));
  };

  const handleFileChange = async (event) => {
    const { files } = event.target;
    if (!files?.length) {
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await uploadImages({
        files,
        uid: user.uid,
        indexStart: nextImageIndex(imageAttrs),
        onProgress: setUploadProgress,
      });
      setImageAttrs((prev) => ({ ...prev, ...response }));
    } catch (err) {
      setError("No se pudieron subir las imágenes.");
      console.error("Reply upload error:", err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const submit = async () => {
    if (submitting || uploading) {
      return;
    }
    // Legacy submitPost strips &nbsp;/&amp; from the contenteditable HTML.
    const trimmed = (composerRef.current?.getHtml() || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .trim();
    const hasImage = Object.keys(imageAttrs).length > 0;
    if ((!trimmed || composerRef.current?.isEmpty()) && !hasImage) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const data = await submitMessage({
        comments: trimmed,
        uid: user.uid,
        tags: "",
        minigrito: {
          indice: parent.INDICE,
          entrada: parent.ID,
        },
        ...imageAttrs,
      });
      composerRef.current?.clear();
      setImageAttrs({});
      setShowEmojis(false);
      const mensaje = normalizeMessage(data?.mensaje);
      if (mensaje) {
        onPosted(mensaje);
      }
    } catch (err) {
      setError("No se pudo enviar el comentario.");
      console.error("Reply submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Legacy mounts formView's own root (className "formulario") *inside* a
  // separate ".mini-form" wrapper (baseMsgView.render(): `$('.mini-form')
  // .html(this.formView.render().el)`, msgView-t.html: `<div class="mini-form">`).
  // main.less's `.mini-form .formulario { padding: 0; .form-submit
  // {display:none}; ... }` block depends on that nesting to strip the 960px
  // composer's 20px padding and reposition the icons for a reply. Putting
  // both classes on one div — as this used to — means that selector never
  // matches, so replies rendered with the full-size composer's padding, wrong
  // icon offsets, and a "Grita" button legacy hides here (Enter submits).
  return (
    <div className="mini-form">
      <div className="formulario active">
        <div className="mdl-card mdl-shadow--4dp">
          <RichComposer
            ref={composerRef}
            placeholder="hmmm..."
            submitOnEnter
            onEnterSubmit={submit}
            captureUrls
            userId={user.ID || user.uid}
          />
          {imageThumbs(imageAttrs).length > 0 && (
            <div className="thumbs-place">
              {imageThumbs(imageAttrs).map((thumb) => (
                <img key={thumb.key} src={thumb.src} alt="adjunto" />
              ))}
            </div>
          )}
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
            onClick={() => setShowEmojis((v) => !v)}
            onKeyDown={(e) => e.key === "Enter" && setShowEmojis((v) => !v)}
          >
            {/* Matches legacy formView: the yellow smile.svg, not a material glyph. */}
            <img className="emojione" alt="😝" title="emojis" src={smile} />
          </div>
          {/* Hidden by `.mini-form .formulario .form-submit { display: none }`
              once the nesting above is correct — replies submit on Enter, as
              legacy's does; the button stays in the DOM only as a fallback. */}
          <div className="form-submit">
            <button
              type="button"
              className="form-submit-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
              disabled={submitting || uploading}
              onClick={submit}
            >
              Grita
            </button>
          </div>
          {showEmojis && (
            <div className="emojis-modal-place" style={{ display: "block" }}>
              <EmojisModal onSelect={handleEmojiSelect} />
            </div>
          )}
          {uploading && (
            <span className="upload-status">
              Subiendo... {uploadProgress}%
              <progress
                className="upload-progress"
                value={uploadProgress}
                max="100"
              />
            </span>
          )}
          {error && <div className="form-error">{error}</div>}
        </div>
      </div>
    </div>
  );
};

ReplyForm.propTypes = {
  parent: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    INDICE: PropTypes.string.isRequired,
  }).isRequired,
  onPosted: PropTypes.func.isRequired,
};

export default ReplyForm;
