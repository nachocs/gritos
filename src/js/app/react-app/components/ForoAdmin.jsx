import PropTypes from "prop-types";
import { useUser } from "../hooks/useContexts";
import { openModal } from "../utils/modalEvents";

/**
 * The foro/wall admin gear, ported from mainView-t.html.
 *
 * Legacy renders this in the *layout*, as a sibling of the head card and
 * outside its conditional — so the deployed app shows it on every foro-scoped
 * surface (feed, single message, gallery, votaciones) for anyone who can edit
 * the foro. It used to live inside `ForoPage`, so it vanished on `/:foro/:id`,
 * `/:foro/gallery` and `/:foro/votaciones` — the same mistake as the head card
 * (#46), and invisible until you audit while logged in as an owner.
 *
 * It has to stay a sibling rather than move into `ForoDescription`, because
 * that component renders nothing when a foro has no intro text, while the gear
 * must still appear.
 */
const canAdminForo = (head, user) => {
  if (!head || !user?.ID || !head.INDICE || head.INDICE === "foroscomun") {
    return false;
  }
  const owners = head.Userid ? String(head.Userid).split("|") : [];
  return (
    owners.includes(String(user.ID)) ||
    (head.INDICE === "ciudadanos" && String(user.ID) === String(head.ID)) ||
    Number(user.nivel) > 7
  );
};

const ForoAdmin = ({ head }) => {
  const { user } = useUser();

  if (!canAdminForo(head, user)) {
    return null;
  }

  // Legacy openForoAdmin(): edit the foro/wall head via the edit modal.
  const openForoAdmin = () =>
    openModal({
      model: {
        show: true,
        header: head?.INDICE === "ciudadanos" ? "EDITA TU MURO" : "EDITAR FORO",
      },
      editForm: { msg: head, isHead: true },
    });

  return (
    <div
      className="foro-admin"
      role="button"
      tabIndex={0}
      title="Editar foro"
      onClick={openForoAdmin}
      onKeyDown={(event) => event.key === "Enter" && openForoAdmin()}
    >
      <i className="fa fa-cog fa-lg" aria-hidden="true" />
    </div>
  );
};

ForoAdmin.propTypes = {
  head: PropTypes.shape({
    INDICE: PropTypes.string,
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Userid: PropTypes.string,
    Titulo: PropTypes.string,
  }),
};

export { canAdminForo };
export default ForoAdmin;
