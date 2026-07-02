import { useEffect, useState } from "react";
import { onAviso } from "../utils/avisosEvents";

const AvisosBanner = () => {
  const [avisos, setAvisos] = useState({ room: null, count: 0 });

  useEffect(() => {
    const handleAviso = (data) => {
      if (!data.room || data.room.includes("/")) {
        return;
      }
      setAvisos((current) => ({
        room: data.room.replace(/collection:/, ""),
        count: current.count + 1,
      }));
    };

    return onAviso(handleAviso);
  }, []);

  if (!avisos.count) {
    return null;
  }

  return (
    <div className="avisos-banner mdl-color--orange-50 mdl-shadow--2dp">
      <span className="avisos-banner__label">Avisos</span>
      <strong className="avisos-banner__count">{avisos.count}</strong>
      {avisos.room && (
        <span className="avisos-banner__room">Nuevo en {avisos.room}</span>
      )}
    </div>
  );
};

AvisosBanner.propTypes = {};

export default AvisosBanner;
