import Backbone from 'backbone';
import _ from 'lodash';
import endpoints from '../endpoints';
import io from 'socket.io-client';

export default Backbone.Model.extend({
  initialize(){
    this.socket = io(endpoints.socket);
  },
  defaults: {
    Titulo: 'gritos.com',
    INTRODUCCION: '',
  },
  idAttribute: 'Name',
  urlRoot: endpoints.apiUrl  + 'head.cgi?',
  parse(resp){
    return _.isEmpty(resp) ? this.defaults : resp;
  },
  changeForo(foro){
    if (this.id){
      this.socket.emit('unsubscribe', this.id);
    }
    this.set({
      Name: foro,
    });
    this.fetch();
  },

});
