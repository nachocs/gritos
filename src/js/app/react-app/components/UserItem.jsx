import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import defaultDreamy from "../../../../img/dreamy4.gif";

/**
 * Single user row in the user list.
 * Migrated from legacy main/userList/userListItemView.js — links to the
 * ciudadanos profile and shows the user's avatar (dreamy or Facebook picture).
 */
const UserItem = ({ user }) => {
  const userId = user.ID || user.id;
  const avatar = user.dreamy_principal || user.FB_picture || defaultDreamy;

  return (
    <li className="user-list-item">
      <Link to={`/ciudadanos/${userId}`} className="user-list-item__link">
        <div
          className="minidreamy"
          style={{ backgroundImage: `url(${avatar})` }}
        />
        <span>{user.alias_principal}</span>
      </Link>
    </li>
  );
};

UserItem.propTypes = {
  user: PropTypes.object.isRequired,
};

export default UserItem;
