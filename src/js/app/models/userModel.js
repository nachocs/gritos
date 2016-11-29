import Backbone from 'backbone';
import Cookies from 'js-cookie';
import $ from 'jquery';

const UserModel = Backbone.Model.extend({
  idAttribute: 'ID',
  initialize() {
    const city = Cookies.getJSON('city');
    if (city && city.uid) {
      this.set('uid', city.uid);
      this.load(city.uid);
    }
  },
  load(uid) {
    const self = this;
    $.ajax({
      type: 'POST',
      url: 'api/login.cgi',
      data: {
        uid,
      },
      success(data) {
        if (data.status !== 'ok') {
          console.log('error: ', data.status);
        } else {
          self.set(data.user);
        }
      },
    });
  },
});
export default new UserModel();
