import moment from "moment";
import PropTypes from "prop-types";
import defaultDreamy from "../../../../img/dreamy4.gif";
import { useUser } from "../hooks/useContexts";

const unixDate = (value) => {
  if (!value) return null;
  if (typeof value === "number" || /^[0-9]+$/.test(String(value))) {
    return moment.unix(Number(value)).fromNow();
  }
  return value;
};

const normalizeIndiceBasic = (indice) =>
  String(indice || "")
    .replace(/^gritos\//, "")
    .replace(/^foros\//, "")
    .replace(/\/.*$/, "");

const getIndiceBasic = (indice, head, userId) => {
  const basic = normalizeIndiceBasic(indice);
  if (/^ciudadanos/.test(indice) && head) {
    if (head.ID === userId) {
      return "tu muro";
    }
    return `el muro de ${String(head.alias_principal || "").replace(/\s/g, "_")}`;
  }
  return basic;
};

const getCountPhrase = (diferencia) => {
  const count = Number(diferencia);
  if (!count || count < 1) {
    return "";
  }
  return count > 1 ? ` y ${count - 1} más` : "";
};

const getTypeIcon = (subtipo) => {
  if (subtipo === "love") {
    return <i className="fa fa-heart love active" aria-hidden="true" />;
  }
  if (subtipo === "mola") {
    return <i className="fa fa-thumbs-up mola active" aria-hidden="true" />;
  }
  if (subtipo === "nomola") {
    return <i className="fa fa-thumbs-down nomola active" aria-hidden="true" />;
  }
  return null;
};

const buildMessage = (data, indiceBasic, userId) => {
  const tipo = data.tipo;
  const entry = data.entry || {};
  const parent = data.parent || null;
  const diferencia = String(entry.diferencia || data.diferencia || "1");
  const countPhrase = getCountPhrase(diferencia);

  if (tipo === "yo") {
    const namePart = entry.name ? `${entry.name}${countPhrase}` : diferencia;
    const verb = Number(diferencia) === 1 ? "gritó" : "gritaron";
    return `${namePart} ${verb} en tu muro`;
  }

  if (tipo !== "msg") {
    const hasName = !!entry.name;
    const verb =
      tipo === "foro"
        ? Number(diferencia) === 1
          ? "gritó"
          : "gritaron"
        : Number(diferencia) === 1
          ? "comentó"
          : "comentaron";
    const prefix = hasName
      ? `${entry.name}${countPhrase} ${verb} en`
      : `${diferencia} ${verb} en`;

    if (parent) {
      if (parent.ciudadano === userId) {
        return `${prefix} tu grito de ${indiceBasic}`;
      }
      if (parent.name === entry.name) {
        return `${prefix} su grito de ${indiceBasic}`;
      }
      return `${prefix} el grito de ${parent.name} de ${indiceBasic}`;
    }

    if (/\/\d+$/.test(data.indice || "")) {
      return `${prefix} un grito de ${indiceBasic}`;
    }

    return `${prefix} ${indiceBasic}`;
  }

  const citizenName = entry.citizen?.alias_principal || "Alguien";
  const icon = getTypeIcon(data.subtipo);
  const itemText = `${citizenName}${countPhrase}`;
  const targetType = /\/\d+\/\d+$/.test(data.indice || "")
    ? "comentario"
    : "grito";

  return (
    <>
      {itemText} {icon} en tu {targetType} de <strong>{indiceBasic}</strong>
    </>
  );
};

const NotificacionesItem = ({ item, onClick }) => {
  const { user } = useUser();
  const data = item;
  const entry = data.entry || {};
  const head = data.head || null;
  const indiceBasic = getIndiceBasic(data.indice, head, user?.ID);
  const dateText = unixDate(entry.FECHA || entry.date || data.date);
  const imageSrc =
    entry.emocion || entry.citizen?.dreamy_principal || defaultDreamy;

  return (
    <li className="notificaciones-item" onClick={onClick}>
      <div className="notificaciones-dreamy">
        <img src={imageSrc} alt="avatar" style={{ height: 40 }} />
      </div>
      <div className="nots-text">
        <div>{buildMessage(data, indiceBasic, user?.ID)}</div>
        {dateText && <div style={{ color: "#90949c" }}>{dateText}</div>}
      </div>
    </li>
  );
};

NotificacionesItem.propTypes = {
  item: PropTypes.shape({
    tipo: PropTypes.string,
    indice: PropTypes.string,
    entry: PropTypes.shape({
      FECHA: PropTypes.number,
      date: PropTypes.string,
      diferencia: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      citizen: PropTypes.shape({
        alias_principal: PropTypes.string,
        dreamy_principal: PropTypes.string,
        ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
      emocion: PropTypes.string,
      dreamy_principal: PropTypes.string,
    }),
    head: PropTypes.shape({
      ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      alias_principal: PropTypes.string,
    }),
    parent: PropTypes.shape({
      ciudadano: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
    subtipo: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default NotificacionesItem;
