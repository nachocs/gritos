import Backbone from 'backbone';
import _ from 'underscore';
const model = require('./msgModel');
export default Backbone.Collection.extend({
  model,
  initialize(models, options) {
    if (options && options.id) {
      this.id = options.id;
    }
    this.lastEntry = 0;
    this.listenTo(this, 'sync', _.bind(function () {
      this.loading = false;
    }, this));
    this.listenTo(this, 'error', _.bind(function () {
      this.loading = false;
    }, this));
    this.listenTo(this, 'request', _.bind(function () {
      this.loading = true;
    }, this));
  },
  sort: 'ID',
  url() {
    return 'http://gritos.com/jsgritos/api/index.cgi?' + this.id;
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
