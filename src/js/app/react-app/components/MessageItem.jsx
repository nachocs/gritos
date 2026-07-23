import $ from "jquery";
import moment from "moment";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "slick-carousel/slick/slick.js";
import { shareTo } from "../../util/socialShare";
import { useUser } from "../hooks/useContexts";
import {
  deleteMessage,
  fetchMessage,
  normalizeMessage,
  saveMessage,
} from "../utils/foroApi";
import formatComments from "../utils/formatComments";
import { openModal } from "../utils/modalEvents";
import EncuestaBlock, { parseEncuesta } from "./EncuestaBlock";
import MiniThread from "./MiniThread";
import MolaActions from "./MolaActions";

const getImageIndexes = (message) => {
  const indexes = new Set();
  Object.keys(message).forEach((key) => {
    const match = key.match(/^IMAGEN(\d+)_URL$/);
    if (match) {
      indexes.add(Number(match[1]));
    }
  });
  return Array.from(indexes).sort((a, b) => a - b);
};

const getImages = (message) =>
  getImageIndexes(message)
    .map((index) => {
      const src = message[`IMAGEN${index}_URL`];
      if (!src) {
        return null;
      }
      const width = Number(message[`IMAGEN${index}_ancho`]) || undefined;
      const height = Number(message[`IMAGEN${index}_alto`]) || undefined;
      return { src, width, height };
    })
    .filter(Boolean);

const formatMessageTime = (value) => {
  if (!value) {
    return null;
  }
  const unixValue = Number(value);
  if (!Number.isNaN(unixValue) && unixValue > 0) {
    return moment.unix(unixValue).fromNow(true);
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed.fromNow(true) : null;
};

// Port of legacy msgView serializer's tagsShown: `publicados` is a
// pipe-separated list of "name,value" pairs; the message's own foro is
// appended, and ciudadanos entries show the citizen alias with an @.
const getTags = (message) => {
  const tags = [];
  if (message.publicados) {
    message.publicados.split(/\|/).forEach((pub) => {
      const [name, rawValue] = pub.split(/,/);
      if (rawValue) {
        tags.push({ name, value: rawValue.replace(/^gritos\//, "") });
      }
    });
  }
  const indice = message.INDICE || "";
  if (!indice.match(/^ciudadanos\//)) {
    const mainName = indice.replace(/^gritos\//, "").replace(/^foros\//, "");
    tags.push({ name: mainName, value: mainName });
  } else if (message.indice_ciudadano_alias) {
    tags.push({
      name: message.indice_ciudadano_alias.replace(/\s/g, "_"),
      value: indice,
    });
  }
  const seen = new Set();
  return tags.filter(
    (tag) => tag.value && !seen.has(tag.value) && seen.add(tag.value),
  );
};

const shareUrl = (message) =>
  `https://gritos.com/${(message.INDICE || "").replace(/^gritos\//, "")}/${message.ID}`;

const MessageItem = ({ message, currentForo, head, showForm, forceThread }) => {
  const { user } = useUser();
  // Card-local copy so votes/edits update in place (legacy re-rendered the
  // view off its own model); re-synced whenever the list refreshes the prop.
  const [msg, setMsg] = useState(message);
  const [deleted, setDeleted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [zoomSrc, setZoomSrc] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    setMsg(message);
  }, [message]);

  const images = getImages(msg);
  const isCarousel = images.length > 1;
  const imageKey = images.map((image) => image.src).join("|");

  // Legacy baseMsgView.js initializes slick on `.images-place` once it has
  // 2+ images: up to 3 slides, dots + arrows, adaptiveHeight so the row
  // matches whichever slide is current, collapsing to 2/1 slides on
  // narrower breakpoints.
  useEffect(() => {
    if (!isCarousel || !carouselRef.current) {
      return undefined;
    }
    const $el = $(carouselRef.current);
    const slidesToShow = images.length < 3 ? images.length : 3;
    const timer = setTimeout(() => {
      $el.slick({
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow,
        slidesToScroll: slidesToShow,
        arrows: true,
        adaptiveHeight: true,
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow,
              slidesToScroll: slidesToShow,
              infinite: true,
              dots: true,
            },
          },
          {
            breakpoint: 600,
            settings: { slidesToShow: 2, slidesToScroll: 2 },
          },
          {
            breakpoint: 480,
            settings: { slidesToShow: 1, slidesToScroll: 1 },
          },
        ],
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      if ($el.hasClass("slick-initialized")) {
        $el.slick("unslick");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCarousel, imageKey]);

  if (deleted) {
    return null;
  }

  const id = msg.ID || msg.wId;
  const routeForo = msg.INDICE
    ? msg.INDICE.replace(/^gritos\//, "")
    : currentForo;
  const messageLink = `/${routeForo}/${id}`;
  const displayName = msg.name || msg.ciudadano || "Anónimo";
  const authorLink = msg.ciudadano ? `/ciudadanos/${msg.ciudadano}` : null;
  const content = formatComments(msg.comments || msg.COMMENTS || "");
  const date = formatMessageTime(msg.FECHA || msg.date || msg.fecha || null);
  const emotionUrl = (msg.emocion || "").replace("http://dreamers.com", "");
  const encuesta = parseEncuesta(msg.encuesta);
  const tags = getTags(msg);

  // Legacy permission rules from msgView-t.html.
  const headUserids = head?.Userid ? head.Userid.split(/\|/) : [];
  const isOwner = user?.ID && user.ID === msg.ciudadano;
  const canDelete =
    isOwner || Number(user?.nivel) > 7 || (user?.ID && headUserids.includes(user.ID));
  const canManagePoll = encuesta && canDelete;

  const handleContentClick = (event) => {
    const spoiler = event.target.closest?.(".spoiler");
    if (spoiler) {
      event.preventDefault();
      event.stopPropagation();
      // Reveal/hide in place (legacy used a tooltip; same information).
      if (spoiler.classList.contains("spoiler-on")) {
        spoiler.textContent = "SPOILER";
        spoiler.classList.remove("spoiler-on");
      } else {
        spoiler.textContent = spoiler.getAttribute("data-tip");
        spoiler.classList.add("spoiler-on");
      }
    }
    const img = event.target.closest?.("img.img-hover");
    if (img?.src) {
      setZoomSrc(img.src);
    }
  };

  const confirmDelete = () => {
    openModal({
      model: { show: true, header: "¿BORRAR GRITO?" },
      body: "¿Seguro que quieres borrar este mensaje?",
      action: async () => {
        try {
          await deleteMessage({ message: msg });
          setDeleted(true);
        } catch (err) {
          console.error("delete failed:", err);
        }
      },
    });
  };

  const confirmBan = () => {
    openModal({
      model: { show: true, header: "¿ESTE GRITO APESTA?" },
      body: "¿Seguro que quieres denunciar este mensaje como basura?",
      // Legacy banThis() was a stub too (console.log only).
      action: () => console.log("ban run"),
    });
  };

  const editThis = () => {
    openModal({
      model: { show: true, header: "EDITAR GRITO" },
      editForm: {
        msg,
        collection: { id: routeForo },
        // post.cgi returns the saved entity; without this the card kept
        // showing the pre-edit text/images until the next full reload.
        onSaved: (updated) => {
          if (updated) {
            setMsg((prev) => normalizeMessage({ ...prev, ...updated }));
          }
        },
      },
    });
  };

  const pararVotacion = async () => {
    try {
      const fresh = await fetchMessage({ foro: msg.INDICE, id: msg.ID });
      const freshEncuesta = parseEncuesta(fresh.encuesta);
      if (!freshEncuesta) {
        return;
      }
      freshEncuesta.cerrado = !freshEncuesta.cerrado;
      const updated = { ...fresh, encuesta: JSON.stringify(freshEncuesta) };
      const saved = await saveMessage({ message: updated });
      setMsg(saved && saved.ID ? saved : updated);
    } catch (err) {
      console.error("poll toggle failed:", err);
    }
  };

  return (
    <article className="msg">
      {emotionUrl && (
        <div
          className="emocion"
          style={{ backgroundImage: `url(${emotionUrl})` }}
        />
      )}
      <div className="mdl-card mdl-shadow--4dp">
        <div className="action-icons">
          {showForm && (
            <>
              <div className="forward">
                <Link to={messageLink}>
                  <i
                    className="fa fa-chevron-circle-right fa-lg"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <div
                className="share"
                title="share"
                onClick={() => setShareOpen((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShareOpen((v) => !v)}
              >
                <i className="fa fa-share-alt" aria-hidden="true" />
                <div className={`share-menu ${shareOpen ? "active" : ""}`}>
                  <ul>
                    <li>
                      <i
                        className="fa fa-facebook-official fa-lg"
                        aria-hidden="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareTo("facebook", shareUrl(msg), head?.Titulo || "");
                        }}
                      />
                    </li>
                    <li>
                      <i
                        className="fa fa-twitter-square fa-lg"
                        aria-hidden="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareTo("twitter", shareUrl(msg), head?.Titulo || "");
                        }}
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
          {user?.ID && (
            <div
              className="show-admin"
              title="admin"
              onClick={() => setAdminOpen((v) => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setAdminOpen((v) => !v)}
            >
              <i className="fa fa-angle-down fa-lg" aria-hidden="true" />
              <div className={`admin-menu ${adminOpen ? "active" : ""}`}>
                <ul>
                  <li>
                    <i
                      className="fa fa-ban fa-lg js-ban"
                      aria-hidden="true"
                      title="spam!"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmBan();
                      }}
                    />
                  </li>
                  {canDelete && (
                    <li>
                      <i
                        className="fa fa-trash-o fa-lg js-delete"
                        aria-hidden="true"
                        title="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete();
                        }}
                      />
                    </li>
                  )}
                  {isOwner && (
                    <li>
                      <i
                        className="fa fa-pencil fa-lg js-edit"
                        aria-hidden="true"
                        title="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          editThis();
                        }}
                      />
                    </li>
                  )}
                  {canManagePoll && (
                    <li>
                      <span
                        className="js-parar-encuesta fa-stack fa-lg"
                        title={`${encuesta.cerrado ? "abrir" : "cerrar"} votacion`}
                        style={{ width: "1em", height: "1em", lineHeight: "1em" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          pararVotacion();
                        }}
                      >
                        <i
                          className="fa fa-lg fa-bar-chart fa-stack-1x"
                          style={{ fontSize: "1em" }}
                        />
                        {!encuesta.cerrado && (
                          <i
                            className="fa fa-lg fa-ban fa-stack-2x"
                            style={{ color: "red", fontSize: "1.33333333em" }}
                          />
                        )}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="mdl-card__title">
          <div className="mdl-card__title-text">
            {authorLink ? (
              <Link to={authorLink}>{displayName}</Link>
            ) : (
              displayName
            )}
          </div>
          {date && <div className="mdl-card__subtitle-text">{date}</div>}
          {showForm && <div className="rabito" />}
        </div>
        <div
          className="mdl-card__supporting-text"
          onClick={handleContentClick}
        >
          {images.length > 0 && (
            <div
              className="images-place"
              ref={isCarousel ? carouselRef : undefined}
            >
              {images.map((image, index) => {
                if (isCarousel) {
                  // Legacy displayImage2: full-width, zoomable when tall.
                  const zoomable = (image.height || 0) > 364;
                  return (
                    <div key={index}>
                      <img
                        title={zoomable ? "click para zoom" : ""}
                        className={zoomable ? "img-hover" : ""}
                        alt="imagen"
                        src={image.src}
                        width="100%"
                      />
                    </div>
                  );
                }
                const isVertical =
                  image.width && image.height
                    ? image.width < image.height
                    : false;
                const style = {};
                if (image.width) {
                  style.maxWidth = `${image.width}px`;
                }
                if (image.height) {
                  style.maxHeight = `${image.height}px`;
                }
                return (
                  <div
                    key={index}
                    className={isVertical ? "msg-img-vertical" : "msg-img"}
                    style={style}
                  >
                    <img
                      alt="imagen"
                      src={image.src}
                      width={image.width}
                      loading="lazy"
                      className="js-lazy-image js-lazy-image--handled fade-in"
                    />
                  </div>
                );
              })}
            </div>
          )}
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            !images.length && <p>Sin contenido disponible.</p>
          )}
        </div>
        {encuesta && <EncuestaBlock message={msg} onMessageChange={setMsg} />}
        <div className="foot">
          {showForm && tags.length > 0 && (
            <div className="tags">
              {tags.map((tag) => (
                <Link key={tag.value} to={`/${tag.value}`}>
                  {tag.value.match(/^ciudadanos/) ? "@" : "#"}
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
          <MolaActions message={msg} onMessageChange={setMsg} />
        </div>
      </div>
      {(showForm || forceThread) && msg.INDICE && msg.ID && (
        <MiniThread message={msg} forceLoad={forceThread} />
      )}
      <div
        className={`imagen-modal ${zoomSrc ? "active" : ""}`}
        onClick={() => setZoomSrc(null)}
        onMouseOut={() => setZoomSrc(null)}
      >
        {zoomSrc && <img src={zoomSrc} alt="imagen ampliada" />}
      </div>
    </article>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    wId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    INDICE: PropTypes.string,
    FECHA: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    comments: PropTypes.string,
    ciudadano: PropTypes.string,
    emocion: PropTypes.string,
    encuesta: PropTypes.string,
    publicados: PropTypes.string,
  }).isRequired,
  currentForo: PropTypes.string,
  head: PropTypes.shape({
    Titulo: PropTypes.string,
    Userid: PropTypes.string,
  }),
  showForm: PropTypes.bool,
  forceThread: PropTypes.bool,
};

MessageItem.defaultProps = {
  currentForo: "foroscomun",
  head: null,
  showForm: true,
  forceThread: false,
};

export default MessageItem;
