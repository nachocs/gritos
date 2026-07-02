import PropTypes from "prop-types";
import UserItem from "./UserItem";

/**
 * Renders the list of users.
 * Migrated from legacy main/userList/userListView.js.
 */
const UserList = ({ users, head }) => (
  <div className="user-list">
    {head && (
      <div className="user-list-head">
        <span>{head}</span>
      </div>
    )}
    {users.length === 0 ? (
      <p>No hay usuarios para mostrar.</p>
    ) : (
      <ul className="user-list-content">
        {users.map((user) => (
          <UserItem key={user.ID || user.id} user={user} />
        ))}
      </ul>
    )}
  </div>
);

UserList.propTypes = {
  users: PropTypes.array,
  head: PropTypes.string,
};

UserList.defaultProps = {
  users: [],
  head: "",
};

export default UserList;
