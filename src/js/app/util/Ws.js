import io from 'socket.io-client';
import endpoints from './endpoints';
import vent from './vent';

class Ws{
  constructor(){
    this.subscriptions = {};
    this.socket = io(endpoints.socket + '/indices', {secure: true, path:'/ws/socket.io'});
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
  prepararNotificaciones(userId){
    this.socket.emit('prepararNotificaciones', userId);
  }
  captureUrlRequest(userId, url){
    this.socket.emit('capture_url_request', userId, url);
  }
}
const ws = new Ws();
export default ws;
