import Backbone from 'backbone';
import userModel from './userModel';
import Ws from '../util/Ws';
import vent from '../util/vent';

const NotificacionesCollection = Backbone.Collection.extend({
  initialize(){
    this.listenTo(userModel, 'change:ID', (user)=>{
      Ws.prepararNotificaciones(user.id); // llama a que se preparen las notificaciones
      vent.on('notificaciones_' + user.id, data => { // recibe una lista de notificaciones
        console.log('recibida notificacion', data);
        data.forEach((not)=>{
          if (not.entry){
            if(not.entry.ciudadano !== userModel.get('ID') || (not.tipo === 'msg' && not.subtipo)){
              this.add(data, {merge: true, fromSocket:true});
            }
          }
        });
      });
    });
  },
});

export default new NotificacionesCollection();
