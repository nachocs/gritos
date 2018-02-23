import Backbone from 'backbone';
import globalModel from '../../models/globalModel';
import model from '../../models/msgModel';
import _ from 'lodash';

export default Backbone.Collection.extend({
  model,
  initialize() {
    // this.listenTo(globalModel, 'change', () => {
    // });
  },
  url() {
    let uri;
    this.indice = this.getIndice();
    if (this.indice) {
      uri = 'https://gritos.com/jsgritos/api/json.cgi?indice=' + this.indice + '&encontrar=IMAGEN0_THUMB&max=10';
      if (this.lastReadEntry) {
        uri = uri + '&last=' + this.lastReadEntry;
      }
      return uri;
    }
  },
  getIndice() {
    let id = globalModel.get('ID');
    if (id) {
      if (id.match(/foroscomun/)) {
        id = null;
      } else if (id.match(/ciudadanos/)) {
        id = id.replace(/\/$/, '');
      } else {
        id = 'gritos/' + id;
      }
      return id;
    }
  },
  parse(resp) {
    if (resp.length > 0) {
      this.lastReadEntry = Math.max.apply(null, _.map(resp, 'ID'));
    } else {
      this.noMoreEntries = true;
    }
    return resp;
  },
});