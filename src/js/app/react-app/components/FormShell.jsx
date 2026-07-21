import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import defaultDreamy from "../../../../img/dreamy4.gif";
import smile from "../../../../img/smile.svg";
import { useForm, useUser } from "../hooks/useContexts";
import useHead from "../hooks/useHead";
import { buildEmojiHtml } from "../utils/emojiHtml";
import {
  imageThumbs,
  nextImageIndex,
  normalizeMessage,
  uploadImages,
} from "../utils/foroApi";
import { publishNewMessage } from "../utils/messageEvents";
import { openModal } from "../utils/modalEvents";
import normalizeForo from "../utils/normalizeForo";
import EmojisModal from "./EmojisModal";
import EncuestaForm from "./EncuestaForm";
import RichComposer from "./RichComposer";
import TagsEditor from "./TagsEditor";

// Legacy getPlaceholder(): the composer prompt depends on where you are.
const composerPlaceholder = (isWall, isTopicForo, head) => {
  const titulo = head?.Titulo || "";
  if (isWall) {
    return titulo ? `Escribe en el muro de ${titulo}` : "Escribe en el muro";
  }
  if (isTopicForo) {
    return titulo
      ? `Explayate a tu gusto en el foro de ${titulo}`
      : "Explayate a tu gusto en el foro";
  }
  return "Sueltate! Grita! (en tu muro).";
};

// Whether the contenteditable holds anything worth submitting.
const isHtmlEmpty = (html) => {
  if (!html) {
    return true;
  }
  if (/<img/i.test(html)) {
    return false;
  }
  return html.replace(/<[^>]*>/g, "").replace(/ /g, " ").trim().length === 0;
};

/**
 * Composer for new gritos in the current foro (or wall). Replaces legacy
 * main/form/formView.js (foro post flow): a contenteditable comment area with
 * emoji picker, image upload, selection WYSIWYG toolbar, poll creation, a
 * multi-foro tag editor, a per-grito dreamy selector, and contextual
 * placeholders driven by the current foro/wall head.
 */
const FormShell = () => {
  const { foro, id } = useParams();
  const isWall = !foro && Boolean(id);
  const currentForo = isWall ? `ciudadanos/${id}/` : normalizeForo(foro);
  const isTopicForo = !isWall && currentForo !== "foroscomun";

  const { user } = useUser();
  const { submitMessage, setDirty } = useForm();
  const { data: head } = useHead(currentForo);

  const composerRef = useRef(null);
  const pollRef = useRef(null);
  const [imageAttrs, setImageAttrs] = useState({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [emocion, setEmocion] = useState(null);
  const [contentEmpty, setContentEmpty] = useState(true);

  // Legacy keeps the emoji picker and the tag list mutually exclusive:
  // showEmojis() calls toggleTagsIn(false) and toggleTags() calls
  // showEmojisIn(false). Without this both could sit open at once.
  const toggleEmojis = () => {
    setShowEmojis((prev) => !prev);
    setTagsOpen(false);
  };
  const toggleTags = () => {
    setTagsOpen((prev) => !prev);
    setShowEmojis(false);
  };

  // A Backbone-model-shaped shim so the existing DreamysModal (which does
  // formModel.set("emocion", url) on select) can drive per-grito dreamy choice.
  const formModelData = useRef({});
  const formModel = useMemo(
    () => ({
      get: (key) => formModelData.current[key],
      set: (key, value) => {
        if (typeof key === "object") {
          Object.assign(formModelData.current, key);
        } else {
          formModelData.current[key] = value;
        }
        setEmocion(formModelData.current.emocion || null);
      },
      toJSON: () => ({ ...formModelData.current }),
    }),
    [],
  );

  const dirty =
    !contentEmpty || Object.keys(imageAttrs).length > 0 || Boolean(emocion);

  // Mirrors legacy Util.checkForms(): block navigation while unsent.
  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);

  const handleContentChange = useCallback((html) => {
    setContentEmpty(isHtmlEmpty(html));
  }, []);

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

  const openDreamyPicker = () => {
    openModal({
      model: { show: true, header: "Selecciona tu dreamy para este grito" },
      dreamys: true,
      uploadAvailable: true,
      formModel,
    });
  };

  const resetForm = () => {
    composerRef.current?.clear();
    pollRef.current?.reset();
    formModelData.current = {};
    setImageAttrs({});
    setShowEmojis(false);
    setTagsOpen(false);
    setShowPoll(false);
    setTags("");
    setEmocion(null);
    setContentEmpty(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!user?.uid) {
      setError("Debes iniciar sesión para publicar.");
      return;
    }

    // Legacy submitPost: strip &nbsp;/&amp; from the contenteditable HTML.
    const comments = (composerRef.current?.getHtml() || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&");
    const hasImage = Object.keys(imageAttrs).length > 0;
    if (isHtmlEmpty(comments) && !hasImage) {
      setError("Escribe un mensaje o adjunta una imagen.");
      return;
    }

    const attrs = {
      comments,
      uid: user.uid,
      tags,
      ...imageAttrs,
    };
    if (emocion) {
      attrs.emocion = emocion;
    }
    // Legacy targets the current foro/wall (foroscomun is the implicit default).
    if (isWall) {
      attrs.foro = `ciudadanos/${id}`;
    } else if (isTopicForo) {
      attrs.foro = currentForo;
    }
    const encuesta = showPoll ? pollRef.current?.getEncuesta() : null;
    if (encuesta) {
      attrs.encuesta = encuesta;
    }

    setSubmitting(true);
    try {
      const data = await submitMessage(attrs);
      const posted = normalizeMessage(data?.mensaje);
      publishNewMessage(isWall ? `ciudadanos/${id}` : currentForo, posted);
      resetForm();
    } catch (err) {
      setError("No se pudo publicar el grito. Intenta de nuevo.");
      console.error("Form submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const thumbs = imageThumbs(imageAttrs);

  if (!user?.uid) {
    return null;
  }

  // Legacy formView's root element is just `formulario` (max-width 960px) with
  // the `mdl-card` as an inner wrapper. Putting `mdl-card` on the root too
  // pulled in MDL's default `.mdl-card { width: 330px }`, which clamped the
  // whole composer to a narrow column. Legacy also has no card title — the
  // prompt is the contenteditable's contextual placeholder.
  return (
    <div className="form-shell formulario active">
      <form onSubmit={handleSubmit}>
        <div className="mdl-card mdl-shadow--4dp">
          <div
            className="dreamy"
            role="button"
            tabIndex={0}
            title="selecciona tu dreamy para el grito"
            style={emocion ? { backgroundImage: `url('${emocion}')` } : undefined}
            onClick={openDreamyPicker}
            onKeyDown={(e) => e.key === "Enter" && openDreamyPicker()}
          >
            {!emocion && (
              <img src={defaultDreamy} width="50" height="50" alt="dreamy" />
            )}
          </div>

          <RichComposer
            ref={composerRef}
            placeholder={
              showPoll
                ? "Pregunta lo que quieras"
                : composerPlaceholder(isWall, isTopicForo, head)
            }
            onContentChange={handleContentChange}
            captureUrls
            userId={user.ID || user.uid}
          />

          {showPoll && (
            <div className="encuesta-area active">
              <EncuestaForm ref={pollRef} />
            </div>
          )}

          {thumbs.length > 0 && (
            <div className="thumbs-place">
              {thumbs.map((thumb) => (
                <img key={thumb.key} src={thumb.src} alt="adjunto" />
              ))}
            </div>
          )}

          {/* Legacy positions each composer icon absolutely inside the card
              (.file-submit bottom:14px, .emojis left:90px, .tags-place
              left:121px, .polls-place left:152px) so they sit on one row under
              the text area. The previous `.form-toolbar` / `.upload` wrapper
              classes have no CSS at all, which pulled the icons back into
              normal flow and split them across two lines. */}
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
            title="Emojis"
            onClick={toggleEmojis}
            onKeyDown={(e) => e.key === "Enter" && toggleEmojis()}
          >
            {/* Legacy uses the yellow smile.svg (sized by `.emojis img`), not
                the grey outline material `insert_emoticon` glyph. */}
            <img className="emojione" alt="😝" title="emojis" src={smile} />
          </div>
          <div
            className={`polls-place${showPoll ? " active" : ""}`}
            role="button"
            tabIndex={0}
            title="abre una votación"
            onClick={() => setShowPoll((prev) => !prev)}
            onKeyDown={(e) => e.key === "Enter" && setShowPoll((p) => !p)}
          >
            {/* Deployed uses the FontAwesome bar-chart glyph here, not the
                material `poll` icon — different shape and ~25% larger. */}
            <i className="fa fa-bar-chart" aria-hidden="true" />
          </div>
          {uploading && <span className="upload-status">Subiendo...</span>}

          <TagsEditor
            tags={tags}
            onChange={setTags}
            open={tagsOpen}
            onToggleOpen={toggleTags}
          />

          {error && <div className="form-error">{error}</div>}

          {/* Legacy: plain `.form-submit` (text-align:right) wrapping an MDL
              *raised* accent button. Without `mdl-button--raised` MDL renders a
              flat text button, so "Grita" showed as bare red text instead of
              the filled red button; `mdl-card__actions mdl-card--border` also
              added a divider legacy doesn't have. */}
          <div className="form-submit">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="form-submit-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
            >
              {submitting ? "Enviando..." : "Grita"}
            </button>
          </div>

          {/* Order matters: legacy puts `.emojis-modal-place` *after*
              `.form-submit`. It's a zero-height relative anchor, so rendering
              it earlier pulled the popup up over the emoji icon itself —
              covering the very control you click to close it again (which is
              how the deployed app dismisses it, since it has no
              click-outside handler). */}
          {showEmojis && (
            <div className="emojis-modal-place" style={{ display: "block" }}>
              <EmojisModal onSelect={handleEmojiSelect} />
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormShell;
