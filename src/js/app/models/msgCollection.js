import Backbone from 'backbone';
import _ from 'underscore';
import model from './msgModel';
import endpoints from '../endpoints';
import mockup from '../mockups';

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
  fetch(){ // mockup
    if (mockup.active){
      this.set([...mockup.msgCollectionMockup]);
    } else {
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    }
  },
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
