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
  add_notificaciones(notis){
    this.set({
      uid: UserModel.get('uid'),
    });
    notis.forEach((nots)=>{
      if (!nots.room.match(/^gritos/) && !nots.room.match(/^ciudadanos/)){
        nots.room = 'gritos/' + nots.room;
      }
      if (this.get(nots.tipo)){
        const array = this.get(nots.tipo).split('|');
        let newarray = [];
        let listo = false;
        array.forEach((ele)=>{
          const [esteforo, estenum] = ele.split(',');
          if (esteforo === nots.room){
            newarray.push(esteforo + ',' + nots.last);
            listo = true;
          } else {
            newarray.push(esteforo + ',' + estenum);
          }
        });
        if (!listo){
          newarray.push(nots.room + ',' + nots.last);
        }
        if (newarray.length > 10){
          newarray = newarray.slice(-10, newarray.length);
        }
        this.set(nots.tipo, newarray.join('|'));
      } else {
        this.set(nots.tipo, nots.room + ',' + nots.last);
      }
    });
    this.save();
  },
  runQueue(){
    let changed = false;
    this.updateQueue.forEach((queue)=>{
      if(this.runUpdate(queue.tipo, queue.foro, queue.lastEntry, queue.subtipo)){
        changed = true;
      }
    });
    this.updateQueue = [];
    if (changed){
      this.save();
    }
  },
  update(tipo, foro, lastEntry, subtipo){
    if(this.runUpdate(tipo, foro, lastEntry, subtipo)){
      this.save();
    }
  },
  runUpdate(tipo, foro, lastEntry, subtipo){
    if (tipo !== 'foro' && tipo !== 'minis' && tipo !== 'msg'){return;}
    let changed = false;
    if (!foro.match(/^gritos/) && !foro.match(/^ciudadanos/)){
      foro = 'gritos/' + foro;
    }
    if (!this.loadingFinished){
      this.updateQueue.push({tipo, foro, lastEntry, subtipo});
    } else if (this.id){
      if (this.get(tipo)){
        const array = this.get(tipo).split('|');
        const newarray = [];
        array.forEach((ele)=>{
          const [esteforo, estenum] = ele.split(',');
          if (tipo === 'msg'){
            const molaArray = estenum.split('/');
            const molanumPos = subtipo === 'mola' ? 0 : subtipo === 'nomola' ? 1 : subtipo === 'love' ? 2 : -1;
            if (esteforo === foro && molanumPos > -1 && (!molaArray[molanumPos] || molaArray[molanumPos] < lastEntry)){
              molaArray[molanumPos] = lastEntry;
              newarray.push(esteforo + ',' + molaArray.join('/'));
              changed = true;
            } else {
              newarray.push(esteforo + ',' + estenum);
            }
          } else {
            if (esteforo === foro && estenum < lastEntry){
              newarray.push(esteforo + ',' + lastEntry);
              changed = true;
            } else {
              newarray.push(esteforo + ',' + estenum);
            }
          }
        });
        this.set(tipo, newarray.join('|'));
      }
      return changed;
    }
  },
});

export default new NotificacionesUserModel();
