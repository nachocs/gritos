import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import DreamysService from "../../util/dreamysService";
import endpoints from "../../util/endpoints";
import { decodeBody } from "../utils/apiFetch";
import { useUser } from "../hooks/useContexts";
import { closeModal } from "../utils/modalEvents";

const DreamysModal = ({ uploadAvailable, formModel }) => {
  const { user, updateUser } = useUser();
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

  const selectDreamy = (dreamyUrl) => {
    if (!user?.uid) {
      return;
    }
    if (uploadAvailable && formModel) {
      formModel.set("emocion", dreamyUrl);
    } else {
      updateUser({ dreamy_principal: dreamyUrl });
    }
    closeModal();
  };

  const uploadDreamy = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user?.uid) {
      return;
    }

    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    let imagenesJump = 0;

    if (formModel && typeof formModel.toJSON === "function") {
      Object.keys(formModel.toJSON()).forEach((key) => {
        const match = /IMAGEN(\d+)_URL/.exec(key);
        if (match) {
          const number = Number(match[1]);
          imagenesJump = Math.max(imagenesJump, number + 1);
        }
      });
    }

    Array.from(files).forEach((file, index) => {
      formData.append(`FICHERO_IMAGEN${imagenesJump + index}`, file);
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

      if (!data || data.status === "error") {
        setUploadError("Error al subir el dreamy.");
        return;
      }

      if (formModel && data.response) {
        if (data.response.Ficheros && formModel.get("Ficheros")) {
          data.response.Ficheros = `${formModel.get("Ficheros")},${data.response.Ficheros}`;
        }
        formModel.set(data.response);
      }

      const newImg =
        data.mensaje?.IMAGEN0_THUMB ||
        data.response?.IMAGEN0_THUMB ||
        data.response?.IMAGEN1_URL;
      if (newImg) {
        updateUser({ dreamy_principal: newImg });
        closeModal();
      }
    } catch (err) {
      setUploadError("Error de red al subir el dreamy.");
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  };

  const renderList = (items) => (
    <div className="dreamys-list">
      {items.map((item, index) => {
        const url =
          item.IMAGEN1_URL ||
          item.IMAGEN1_THUMB ||
          item.IMAGEN1_URL ||
          item.images?.default_dreamy;
        if (!url) {
          return null;
        }
        return (
          <button
            key={`${url}-${index}`}
            type="button"
            className="dreamy-card"
            onClick={() => selectDreamy(url)}
          >
            <img src={url} alt={item.subject || "Dreamy"} />
            <span>{item.subject || "Dreamy"}</span>
          </button>
        );
      })}
    </div>
  );

  if (!user?.uid) {
    return (
      <div className="dreamys-modal">
        <p>Debes iniciar sesión para seleccionar un Dreamy.</p>
      </div>
    );
  }

  return (
    <div className="dreamys-modal">
      <section>
        <h3>Dreamys personales</h3>
        {uploadAvailable && (
          <div className="upload-dreamy">
            <label
              htmlFor="dreamy-upload"
              className={`custom-file-upload ${uploading ? "loading" : ""}`}
            >
              {uploading ? "Subiendo..." : "Subir nuevo dreamy"}
            </label>
            <input
              id="dreamy-upload"
              type="file"
              name="FICHERO_IMAGEN1"
              onChange={uploadDreamy}
              disabled={uploading}
            />
          </div>
        )}
        {uploadError && <p className="dreamys-error">{uploadError}</p>}
        {loadingPersonal ? <p>Cargando...</p> : renderList(personalDreamys)}
      </section>
      <section>
        <h3>Dreamys públicos</h3>
        {loadingGeneral ? <p>Cargando...</p> : renderList(generalDreamys)}
      </section>
      <p className="dreamys-note">
        Puedes seleccionar un dreamy para actualizar tu avatar principal.
      </p>
    </div>
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
