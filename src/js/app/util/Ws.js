import io from 'socket.io-client';
import endpoints from './endpoints';
import vent from './vent';

// gritos-socket ya SOLO sirve las vistas previas de enlaces (capture_url_request). Los avisos de la campana y los gritos en vivo van por la
// bandeja de notificaciones (utils/avisosApi.js y utils/salasEnVivo.js), asi que el socket no se abre al cargar la pagina: solo cuando alguien
// pega un enlace en un mensaje.
class Ws{
  constructor(){
    this.socket = io(endpoints.socket + '/indices', {secure: true, path:'/ws/socket.io', autoConnect: false});
    this.socket.on('capture_url_reply', (data)=>{
      vent.trigger('capture_url_reply_' + data.user, data);
    });
  }
  captureUrlRequest(userId, url){
    // socket.io guarda lo emitido hasta que conecta
    if (!this.socket.active){ this.socket.connect(); }
    this.socket.emit('capture_url_request', userId, url);
  }
}
const ws = new Ws();
export default ws;
