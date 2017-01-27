import Backbone from 'backbone';
import userModel from './userModel';
import Ws from '../util/Ws';
import vent from '../util/vent';

const NotificacionesCollection = Backbone.Collection.extend({
  initialize(){
    this.listenTo(userModel, 'change', (user)=>{
      Ws.prepararNotificaciones(user.id); // llama a que se preparen las notificaciones
      vent.on('notificaciones_' + user.id, data => { // recibe una lista de notificaciones
        this.add(data, {fromSocket:true});
        console.log('recibida notificacion', data);
      });
    });
  },
});

export default new NotificacionesCollection();
