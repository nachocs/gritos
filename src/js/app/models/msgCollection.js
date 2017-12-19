import Backbone from 'backbone';
import _ from 'lodash';
import model from './msgModel';
import endpoints from '../util/endpoints';
import mockup from '../util/mockups';
// import io from 'socket.io-client';
import Ws from '../util/Ws';
import vent from '../util/vent';
import NotificacionesUserModel from './notificacionesUserModel';

export default Backbone.Collection.extend({
  model,
  initialize(models, options) {
    this.globalModel = options.globalModel;
    this.msgModel = options.msgModel;
    this.subscriptions = {};
    this.noMoreEntries = false;
    if (options && options.id) {
      this.id = options.id;
    }
    // this.socket = io(endpoints.socket);
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

    if (this.id) {
      this.subscribe(this.id);
    }
    if (this.globalModel) {
      this.listenTo(this.globalModel, 'change', () => {
        this.clean();
        this.id = this.globalModel.get('ID'); // para cuando se cambia de foro principal
        if (this.globalModel.get('msg') || this.globalModel._previousAttributes.msg) {
          this.trigger('reset');
        }
        this.subscribe(this.id);
        this.fetch();
      });
    }
    if (this.msgModel) { // para mini collections
      this.listenTo(this.msgModel, 'remove', this.clean.bind(this));
    }
  },
  clean() {
    if (this.id) {
      this.unsubscribe(this.id);
    }
    if (this.models.length > 0) {
      this.remove(this.models);
    }
  },
  subscribe(room) {
    room = room.replace(/\/$/, '');
    if (this.subscriptions[room]) {
      return;
    }
    this.subscriptions[room] = true;
    Ws.subscribe('collection:' + room);
    vent.on('updated_' + 'collection:' + room, data => {
      const newMsgModel = new model();
      this.add(newMsgModel.parse(data.entry), {
        fromSocket: true,
      });
      vent.trigger('avisos', data);
      const tipo = this.msgModel ? 'minis' : 'foro';
      NotificacionesUserModel.update(tipo, this.id.replace(/\/$/, ''), data.entry.ID);

      console.log('updated', data.room, data.entry);
    });
  },
  unsubscribe(room) {
    delete this.subscriptions[room];
    Ws.unsubscribe(room);
    vent.off('updated_' + room);
  },
  fetch() { // mockup
    if (mockup.active) {
      this.set([...mockup.msgCollectionMockup]);
    } else {
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    }
  },
  url() {
    let route = '';
    if (this.globalModel && this.globalModel.get('msg')) {
      route = this.id + '/' + this.globalModel.get('msg');
    } else {
      route = this.id;
    }
    return endpoints.apiUrl + 'index.cgi?' + route;
  },
  nextPage() {
    if (!this.loading) {
      this.fetch({
        data: {
          init: this.firstEntry,
        },
        remove: false,
      });
    }
  },
  parse(resp) {
    if (this.globalModel && this.globalModel.get('msg')) {
      resp = [resp];
    }
    if (resp.length > 0) {
      const lastReadEntry = Math.max.apply(null, _.map(resp, 'num'));
      const tipo = this.msgModel ? 'minis' : 'foro';
      NotificacionesUserModel.update(tipo, this.id.replace(/\/$/, ''), lastReadEntry);
      this.firstEntry = Math.min.apply(null, _.map(resp, 'num'));
    } else {
      this.noMoreEntries = true;
    }
    return resp;
  },
});