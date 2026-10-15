import io from 'socket.io-client';
import endpoints from './endpoints';
import vent from './vent';

class Ws{
  constructor(){
    this.subscriptions = {};
    this.notificaciones = null;
    this.yaConectado = false;
    this.socket = io(endpoints.socket + '/indices', {secure: true, path:'/ws/socket.io'});
    // Tras una reconexion el servidor es otro socket: no sabe en que salas estaba ni de quien eran los avisos.
    // Sin esto, el primer corte de red (ping timeout) dejaba al usuario sin nada en vivo hasta recargar.
    this.socket.on('connect', ()=>{
      if (this.yaConectado){
        Object.keys(this.subscriptions).forEach((room)=>{
          this.socket.emit('subscribe', room);
        });
        if (this.notificaciones){
          this.socket.emit('prepararNotificaciones', this.notificaciones.userId, this.notificaciones.uid);
        }
      }
      this.yaConectado = true;
    });
    this.socket.on('updated', (data)=>{
      vent.trigger('updated_' + data.room, data);
    });
    this.socket.on('msg', (data)=>{
      vent.trigger('msg_' + data.room, data);
    });
    this.socket.on('notificaciones', (data)=>{
      vent.trigger('notificaciones_' + data.user, data.notificaciones);
    });
    this.socket.on('capture_url_reply', (data)=>{
      vent.trigger('capture_url_reply_' + data.user, data);
    });
  }
  subscribe(room){
    if (this.subscriptions[room]){return;}
    this.subscriptions[room] = true;
    this.socket.emit('subscribe', room);
  }
  unsubscribe(room){
    delete this.subscriptions[room];
    this.socket.emit('unsubscribe', room);
  }
  update(room, subtipo, ciudadano){
    room = room.replace(/\/$/,'');
    this.socket.emit('update', room, subtipo, ciudadano);
  }
  // el uid (la sesion) demuestra que quien pide los avisos es ese usuario: el servidor ya no se fia del ID a secas
  prepararNotificaciones(userId, uid){
    this.notificaciones = {userId, uid};
    this.socket.emit('prepararNotificaciones', userId, uid);
  }
  captureUrlRequest(userId, url){
    this.socket.emit('capture_url_request', userId, url);
  }
}
const ws = new Ws();
export default ws;
