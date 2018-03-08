import Backbone from 'backbone';
import model from './msgModel';
import _ from 'lodash';

export default Backbone.Collection.extend({
  model,
  initialize(models, options) {
    if (options.encontrar) {
      this.encontrar = options.encontrar;
    }
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
    uri = 'https://gritos.com/jsgritos/api/json.cgi?indice=ciudadanos&encontrar=listar:' + this.encontrar + '&max=' + this.max;
    if (this.lastReadEntry) {
      uri = uri + '&last=' + this.lastReadEntry;
    }
    return uri;
  },
  nextPage() {
    if (!this.loading && !this.noMoreEntries) {
      this.fetch({ remove: false });
    }
  },
  parse(resp) {
    if (resp.length === this.max) {
      this.lastReadEntry = Math.min.apply(null, _.map(resp, 'ID'));
    } else {
      this.noMoreEntries = true;
    }
    if (_.isNaN(this.lastReadEntry)) {
      this.lastReadEntry = null;
    }
    return resp;
  },
});