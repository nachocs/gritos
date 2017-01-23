import Backbone from 'backbone';
import _ from 'lodash';
import model from './msgModel';
import endpoints from '../util/endpoints';
import mockup from '../util/mockups';
// import io from 'socket.io-client';
import Ws from '../util/Ws';
import vent from '../util/vent';

export default Backbone.Collection.extend({
  model,
  initialize(models, options) {
    this.parentModel = options.parentModel;
    this.subscriptions = {};
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

    if (this.id){
      this.subscribe(this.id);
    }
    if (this.parentModel){
      this.listenTo(this.parentModel, 'change', () => {
        this.clean();
        this.id = this.parentModel.get('ID'); // para cuando se cambia de foro principal
        if (this.parentModel.get('msg') || this.parentModel._previousAttributes.msg){
          this.trigger('reset');
        }
        this.subscribe(this.id);
        this.fetch();
      });
      this.listenTo(this.parentModel, 'remove', this.clean.bind(this));
    }
  },
  clean(){
    this.cleanSocket();
    this.remove(this.models);
  },
  cleanSocket(){
    if (this.socket && this.socket.connected){
      this.unsubscribe(this.id);
    }
  },
  subscribe(room){
    room = room.replace(/\/$/,'');
    if (this.subscriptions[room]){return;}
    this.subscriptions[room] = true;
    Ws.subscribe('collection:' + room);
    vent.on('updated_collection:' + room, data => {
      this.add(data.entry, {fromSocket:true});
      console.log('updated', data.room, data.entry);
    });
  },
  unsubscribe(room){
    delete this.subscriptions[room];
    Ws.unsubscribe(room);
    vent.off('updated_' + room);
  },
  fetch(){ // mockup
    if (mockup.active){
      this.set([...mockup.msgCollectionMockup]);
    } else {
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    }
  },
  url() {
    let route = '';
    if (this.parentModel.get('msg')){
      route = this.id + '/' + this.parentModel.get('msg');
    } else{
      route = this.id;
    }
    return endpoints.apiUrl + 'index.cgi?' + route;
  },
  nextPage() {
    if (!this.loading && !this.parentModel.get('msg')) {
      this.fetch({
        data: {
          init: this.lastEntry,
        },
        remove: false,
      });
    }
  },
  parse(resp) {
    if (this.parentModel.get('msg')){
      resp = [resp];
    }
    this.lastEntry = Math.min.apply(null, _.map(resp, 'num'));
    return resp;
  },
});
