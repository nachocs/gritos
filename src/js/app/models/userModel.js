import Backbone from 'backbone';
import Cookies from 'js-cookie';
import $ from 'jquery';
import endpoints from '../util/endpoints';
import Ws from '../util/Ws';
import vent from '../util/vent';

const UserModel = Backbone.Model.extend({
  idAttribute: 'ID',
  initialize() {
    const city = Cookies.getJSON('city');
    if (city && city.uid) {
      this.set('uid', city.uid);
      this.load(city.uid);
    }
    vent.on('msg_' + this.get('INDICE') + '/' + this.get('ID'), data => {
      this.set(data.entry);
      console.log('updated ciudadano', data.room, data.entry);
    });
    this.listenTo(this, 'change:uid', () => {
      this.subscribe();
    });
  },
  url() {
    return endpoints.apiUrl + 'index.cgi?' + this.get('INDICE') + '/' + this.get('ID');
  },
  subscribe() {
    if (this.get('INDICE') && this.get('ID')) {
      Ws.update(this.get('INDICE') + '/' + this.get('ID'));
    }
  },
  load(uid) {
    const self = this;
    $.ajax({
      type: 'POST',
      url: endpoints.apiUrl + 'login.cgi',
      data: {
        uid,
      },
      success(data) {
        if (data.status !== 'ok') {
          console.log('error: ', data.status);
          self.clear();
        } else {
          self.set(data.user);
          self.set('uid', uid);
        }
      },
    });
  },
});
export default new UserModel();