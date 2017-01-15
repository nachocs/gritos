import io from 'socket.io-client';
import endpoints from './endpoints';
import vent from './vent';

class Ws{
  constructor(){
    this.socket = io(endpoints.socket);
    this.socket.on('updated', function (data){
      vent.trigger('updated_' + data.room, data);
    });
  }
  subscribe(room){
    this.socket.emit('subscribe', room);
  }
  unsubscribe(room){
    this.socket.emit('unsubscribe', room);
  }
}
const ws = new Ws();
export default ws;
