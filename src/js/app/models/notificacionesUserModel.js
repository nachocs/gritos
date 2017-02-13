import Backbone from 'backbone';
import endpoints from '../util/endpoints';
import UserModel from './userModel';

const NotificacionesUserModel = Backbone.Model.extend({
  idAttribute: 'ID',
  initialize(){
    this.updateQueue = [];
    this.loadingFinished = false;
    if (UserModel.get('ID')){
      this.fetch();
    }
    this.listenTo(UserModel, 'change:ID', ()=>{
      if (UserModel.get('ID')){
        this.fetch();
      } else {
        this.clear();
      }
    });
    this.listenTo(this, 'change', ()=>{
      this.loadingFinished = true;
      this.runQueue();
    });
  },
  url() {
    if (UserModel.get('ID')){
      return endpoints.apiUrl + 'index.cgi?notificaciones/' + UserModel.get('ID');
    }
  },
  runQueue(){
    let changed = false;
    this.updateQueue.forEach((queue)=>{
      if(this.runUpdate(queue.tipo, queue.foro, queue.lastEntry)){
        changed = true;
      }
    });
    this.updateQueue = [];
    if (changed){
      this.save();
    }
  },
  update(tipo, foro, lastEntry){
    if(this.runUpdate(tipo, foro, lastEntry)){
      this.save();
    }
  },
  runUpdate(tipo, foro, lastEntry){
    if (tipo !== 'foro' && tipo !== 'minis' && tipo !== 'msg'){return;}
    let changed = false;
    if (!foro.match(/^gritos/)){
      foro = 'gritos/' + foro;
    }
    if (!this.loadingFinished){
      this.updateQueue.push({tipo,foro,lastEntry});
    } else if (this.id){
      if (this.get(tipo)){
        const array = this.get(tipo).split('|');
        const newarray = [];
        array.forEach((ele)=>{
          const [esteforo, estenum] = ele.split(',');
          if (esteforo === foro && estenum<lastEntry){
            newarray.push(esteforo + ',' + lastEntry);
            changed = true;
          } else {
            newarray.push(esteforo + ',' + estenum);
          }
        });
        this.set(tipo, newarray.join('|'));
      }
      return changed;
    }
  },
});

export default new NotificacionesUserModel();
