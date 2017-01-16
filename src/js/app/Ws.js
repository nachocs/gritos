import io from 'socket.io-client';
import endpoints from './endpoints';
import vent from './vent';

class Ws{
  constructor(){
    this.subscriptions = {};
    this.socket = io(endpoints.socket);
    this.socket.on('updated', function (data){
      vent.trigger('updated_' + data.room, data);
    });
    this.socket.on('msg', function (data){
      vent.trigger('msg_' + data.room, data);
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
  update(room){
    Ws.socket.emit('update', room);
  }
}
const ws = new Ws();
export default ws;
