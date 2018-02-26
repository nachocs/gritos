import Backbone from 'backbone';
import globalModel from '../../models/globalModel';
import model from '../../models/msgModel';
import _ from 'lodash';

export default Backbone.Collection.extend({
  model,
  initialize() {
    this.listenTo(globalModel, 'change', () => {
      this.lastReadEntry = null;
      this.noMoreEntries = false;
      this.reset();
    });
    this.noMoreEntries = false;
    this.loading = false;
    this.max = 10;
    this.listenTo(this, 'sync', () => {
      this.loading = false;
    });
    this.listenTo(this, 'error', () => {
      this.loading = false;
    });
    this.listenTo(this, 'request', () => {
      this.loading = true;
    });
  },
  url() {
    let uri;
    this.indice = this.getIndice();
    if (this.indice) {
      uri = 'https://gritos.com/jsgritos/api/json.cgi?indice=' + this.indice + '&encontrar=Ficheros&max=' + this.max;
      if (this.lastReadEntry) {
        uri = uri + '&last=' + this.lastReadEntry;
      }
      return uri;
    }
  },
  nextPage() {
    if (!this.loading && !this.noMoreEntries) {
      this.fetch({ remove: false });
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
    if (resp.length === this.max) {
      this.lastReadEntry = Math.min.apply(null, _.map(resp, 'ID'));
    } else {
      this.noMoreEntries = true;
    }
    if (_.isNaN(this.lastReadEntry)) {
      debugger;
    }
    return resp;
  },
});