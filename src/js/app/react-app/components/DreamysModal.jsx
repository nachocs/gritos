import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import DreamysService from "../../util/dreamysService";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import { useForm, useUser } from "../hooks/useContexts";
import { closeModal } from "../utils/modalEvents";

const DreamysModal = ({ uploadAvailable, formModel }) => {
  const { user, saveUser } = useUser();
  const { submitMessage } = useForm();
  const [personalDreamys, setPersonalDreamys] = useState([]);
  const [generalDreamys, setGeneralDreamys] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [loadingGeneral, setLoadingGeneral] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const personalSubscription = DreamysService.getPersonalDreamys().subscribe(
      (data) => {
        setPersonalDreamys(data || []);
        setLoadingPersonal(false);
      },
    );
    const generalSubscription = DreamysService.getGeneralDreamys().subscribe(
      (data) => {
        setGeneralDreamys(data || []);
        setLoadingGeneral(false);
      },
    );

    if (user?.ID) {
      DreamysService.fetchPersonalDreamys(user.ID);
    }
    DreamysService.fetchGeneralDreamys();

    return () => {
      personalSubscription.unsubscribe();
      generalSubscription.unsubscribe();
    };
  }, [user?.ID]);

  // Legacy: close first, then either set the composer's `emocion` (when a form
  // owns the picker) or `userModel.save('dreamy_principal', img)` — a real
  // server write. The branch only did a local `updateUser`, so a chosen avatar
  // silently reverted on reload (gap #29).
  const selectDreamy = (dreamyUrl) => {
    if (!user?.uid) {
      return;
    }
    closeModal();
    if (formModel) {
      formModel.set("emocion", dreamyUrl);
      return;
    }
    saveUser({ dreamy_principal: dreamyUrl }).catch((err) => {
      console.error("No se pudo guardar el dreamy:", err);
    });
  };

  const uploadDreamy = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user?.uid) {
      return;
    }

    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file, index) => {
      formData.append(`FICHERO_IMAGEN${index}`, file);
    });

    try {
      const response = await fetch(
        `${endpoints.apiUrl}upload.cgi?sessionId=${encodeURIComponent(user.uid)}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = JSON.parse(await decodeBody(response));

      if (!data || data.status === "error" || !data.response) {
        setUploadError("Error al subir el dreamy.");
        return;
      }

      // Legacy `submitEntry()`: upload.cgi only stores the file — the avatar
      // only changes once a "Nuevo avatar!" entry is posted, and it's *that*
      // response's IMAGEN0_THUMB that becomes the new dreamy. The previous
      // version stopped after the upload and looked for `data.mensaje` on the
      // upload response, where it never exists, so uploading did nothing.
      const posted = await submitMessage({
        ...data.response,
        comments: "Nuevo avatar!",
        uid: user.uid,
        dreamy_anterior: user.dreamy_principal,
      });

      const newImg = posted?.mensaje?.IMAGEN0_THUMB;
      if (newImg) {
        closeModal();
        await saveUser({ dreamy_principal: newImg });
      }
    } catch (err) {
      setUploadError("Error de red al subir el dreamy.");
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  };

  // Legacy renders each dreamy as a bare 100×100 <img class="select-dreamy">
  // and delegates the click ('click .select-dreamy'). The previous version
  // wrapped each in <button class="dreamy-card"> with a caption <span> — and
  // like `.emoji-pick` before it (#55), `.dreamy-card` has no CSS at all, so
  // every dreamy picked up default button chrome instead of `.select-dreamy`'s
  // yellow inset hover glow.
  const renderList = (items) =>
    items.map((item, index) => {
      const url = item.IMAGEN1_URL || item.IMAGEN1_THUMB;
      if (!url) {
        return null;
      }
      return (
        <img
          key={`${url}-${index}`}
          src={url}
          title={item.subject}
          alt={item.subject || "Dreamy"}
          width="100"
          height="100"
          className="select-dreamy"
          onClick={() => selectDreamy(url)}
        />
      );
    });

  // Legacy's modalView only builds this view when a uid exists, so there's no
  // logged-out branch to render.
  if (!user?.uid) {
    return null;
  }

  // Legacy prepends the FB avatar to the personal list when there is one.
  const personal = user.FB_picture
    ? [{ IMAGEN1_URL: user.FB_picture, subject: "FB profile" }, ...personalDreamys]
    : personalDreamys;

  return (
    <>
      <div
        className={`loader${loadingPersonal || loadingGeneral ? " active" : ""}`}
      >
        <i className="fa fa-refresh fa-spin fa-5x fa-fw" />
      </div>
      <div className="personal-dreamys dreamys-container">
        <h4>Dreamys Personales</h4>
        {uploadAvailable && (
          <div className={`upload-dreamy${uploading ? " loading" : ""}`}>
            <div className="loading">
              <i className="fa fa-refresh fa-spin fa-4x" aria-hidden="true" />
            </div>
            <form>
              <label htmlFor="dreamy-submit" className="custom-file-upload">
                <i className="fa fa-cloud-upload fa-4x" aria-hidden="true" />
              </label>
              <input
                type="file"
                id="dreamy-submit"
                title="selecciona un fichero"
                name="FICHERO_IMAGEN1"
                onChange={uploadDreamy}
                disabled={uploading}
              />
            </form>
          </div>
        )}
        {uploadError && <div className="error-form active">{uploadError}</div>}
        {renderList(personal)}
      </div>
      {generalDreamys.length > 0 && (
        <div className="public-dreamys dreamys-container">
          <h4>Dreamys Públicos</h4>
          {renderList(generalDreamys)}
        </div>
      )}
    </>
  );
};

DreamysModal.propTypes = {
  uploadAvailable: PropTypes.bool,
  formModel: PropTypes.shape({
    get: PropTypes.func,
    set: PropTypes.func,
    toJSON: PropTypes.func,
  }),
};

DreamysModal.defaultProps = {
  uploadAvailable: false,
  formModel: null,
};

export default DreamysModal;
