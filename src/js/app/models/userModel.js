import Backbone from 'backbone';
import Cookies from 'js-cookie';
import $ from 'jquery';
import endpoints from '../endpoints';

const UserModel = Backbone.Model.extend({
  idAttribute: 'ID',
  initialize() {
    const city = Cookies.getJSON('city');
    if (city && city.uid) {
      this.set('uid', city.uid);
      this.load(city.uid);
    }
  },
  url() {
    return endpoints.apiUrl + 'index.cgi?' + this.get('INDICE') + '/' + this.get('ID');
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
