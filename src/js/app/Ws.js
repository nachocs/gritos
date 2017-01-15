import io from 'socket.io-client';
import endpoints from './endpoints';
import vent from './vent';

class Ws{
  constructor(){
    this.socket = io(endpoints.socket);
    console.log('socket');
  }
  subscribe(room){
    this.socket.emit('subscribe', room);
    this.socket.on('updated', function (data){
      // console.log('recibido updated', data);
      vent.trigger('updated_' + data.room, data);
    });
  }
  unsubscribe(room){
    this.socket.emit('unsubscribe', room);
  }
}
const ws = new Ws();
export default ws;
