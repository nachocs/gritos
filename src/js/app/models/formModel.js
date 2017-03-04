import Backbone from 'backbone';
import endpoints from '../util/endpoints';
import Ws from '../util/Ws';
import NotificacionesUserModel from './notificacionesUserModel';

export default  Backbone.Model.extend({
  url: endpoints.apiUrl + 'post.cgi',
  defaults: {
    comments: '',
  },
  initialize(){
    this.listenTo(this, 'sync', (model, response) => {
      if (this.room && !this.room.match(/gritosdb/ig)){
        Ws.update('collection:' + this.room);
        this.add_notificaciones(response);
      }
    });
  },
  add_notificaciones(response){
    const array = [];
    if (this.saveAttrs.minigrito){
      array.push({tipo: 'minis', room: this.room, last: response.mensaje.ID});
      array.push({tipo: 'msg', room: this.room + '/' + response.mensaje.ID, last: '0/0/0'});
    } else {
      array.push({tipo: 'foro', room: this.room, last: response.mensaje.ID});
      array.push({tipo: 'msg', room: this.room + '/' + response.mensaje.ID, last: '0/0/0'});
      array.push({tipo: 'minis', room: this.room + '/'+ response.mensaje.ID, last: '0'});
    }
    NotificacionesUserModel.add_notificaciones(array);
  },
  save(attrs){
    this.saveAttrs = attrs;
    if (attrs.minigrito){
      this.room = attrs.minigrito.indice + '/' + attrs.minigrito.entrada;
    } else if (attrs.foro){
      this.room = attrs.foro;
    }
    return Backbone.Model.prototype.save.apply(this, arguments);
  },
});
