import Backbone from 'backbone';
import _ from 'lodash';
import model from './msgModel';
import endpoints from '../endpoints';
import mockup from '../mockups';
import io from 'socket.io-client';

export default Backbone.Collection.extend({
  model,
  initialize(models, options) {
    this.headModel = options.headModel;
    if (options && options.id) {
      this.id = options.id;
    }
    this.socket = io(endpoints.socket);
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
    if (this.id){
      this.socket.emit('subscribe', this.id);
    }
    if (this.headModel){
      this.listenTo(this.headModel, 'sync', _.bind(function () {
        this.reset();
        this.id = this.headModel.id;
        this.socket.emit('subscribe', this.id);
        this.fetch();
      }, this));
    }
  },
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
    this.lastEntry = Math.min.apply(null, _.map(resp, 'num'));
    return resp;
  },
});
