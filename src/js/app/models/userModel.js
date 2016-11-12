import Backbone from 'backbone';
const UserModel = Backbone.Model.extend({
  idAttribute: 'ID',
});
export default new UserModel(); // unique
