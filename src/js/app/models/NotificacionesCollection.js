import Backbone from 'backbone';
import userModel from './userModel';
import Ws from '../util/Ws';
import vent from '../util/vent';

const NotificacionesCollection = Backbone.Collection.extend({
  initialize(){
    this.listenTo(userModel, 'change', (user)=>{
      Ws.prepararNotificaciones(user.id); // llama a que se preparen las notificaciones
      vent.on('notificaciones_' + user.id, data => { // recibe una lista de notificaciones
        console.log('recibida notificacion', data);
        if (data[0].entry && data[0].entry.ciudadano !== userModel.get('ID')){
          this.add(data, {fromSocket:true});
        }
      });
    });
  },
});

export default new NotificacionesCollection();
