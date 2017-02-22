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
        data.forEach((not)=>{
          if (not.entry){
            if(not.entry.ciudadano !== userModel.get('ID') || not.tipo === 'msg'){
              this.add(data, {fromSocket:true});
            }
          }
        });
      });
    });
  },
});

export default new NotificacionesCollection();
