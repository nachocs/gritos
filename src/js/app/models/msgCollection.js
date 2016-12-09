import Backbone from 'backbone';
import _ from 'underscore';
import model from './msgModel';
import endpoints from '../endpoints';

export default Backbone.Collection.extend({
  model,
  initialize(models, options) {
    if (options && options.id) {
      this.id = options.id;
    }
    this.lastEntry = 0;
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
  sort: 'ID',
  url() {
    return endpoints.apiUrl + 'index.cgi?' + this.id;
  },
  nextPage() {
    if (!this.loading) {
      this.fetch({
        data: {
          init: this.lastEntry,
        },
        remove: false,
      });
    }
  },
  parse(resp) {
    this.lastEntry = Math.min.apply(null, _.pluck(resp, 'num'));
    return resp;
  },
});
