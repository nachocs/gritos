import Backbone from 'backbone';
import vent from '../util/vent';
import endpoints from '../util/endpoints';
import Ws from '../util/Ws';
import userModel from './userModel';

export default Backbone.Model.extend({
  initialize() {
    vent.on('msg_' + this.get('INDICE') + '/' + this.get('ID'), data => {
      this.set(data.entry);
    });
    this.listenTo(this, 'sync', () => {
      if (this.get('INDICE') && this.get('ID')) {
        const subtipo = this.changed.mola ? 'mola' : this.changed.nomola ? 'nomola' : this.changed.love ? 'love' : null;
        Ws.update(this.get('INDICE') + '/' + this.get('ID'), subtipo, userModel.get('ID'));
      }
    });
    this.listenTo(this, 'remove', () => {
      Ws.unsubscribe(this.get('INDICE') + '/' + this.get('ID'));
    });
    if (this.get('INDICE') && this.get('ID')) {
      Ws.subscribe(this.get('INDICE') + '/' + this.get('ID'));
    }
  },
  idAttribute: 'wId',
  url() {
    return endpoints.apiUrl + 'index.cgi?' + this.get('INDICE') + '/' + this.get('ID');
  },
  parse(resp) {
    if (resp.INDICE) {
      resp.indice = resp.INDICE;
    }
    if (resp.INDICE && resp.ID) {
      resp.wId = resp.INDICE + '/' + resp.ID;
    }
    return resp;
  },
});