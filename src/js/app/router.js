import Backbone from 'backbone';
import GlobalModel from './models/globalModel';
import Util from './util/util';
import $ from 'jquery';

const Router = Backbone.Router.extend({
  routes: {
    ':foro(/)': 'foro',
    ':foro/:id(/)': 'mensaje',
    '*something': 'defaultRoute',
  },
  initialize() {
    this.model = GlobalModel;
    this.history = [];
  },
  defaultRoute(route) {
    if (route && route.length>0){
      if (route.match(/^\/?(\w+)\/(\d+)\/?/)){
        const [, foro, entrada] = route.match(/^\/?(\w+)\/(\d+)\/?/);
        if (foro && entrada){
          return this.mensaje(foro, entrada);
        } else if (foro){
          return this.foro(foro);
        }
      } else if (route.match(/^(\w+)\//)){
        this.navigate(route.match(/^(\w+)\//)[1], {trigger:true});
      }
    }
    return this.foro();
  },
  foro(foro) {
    if (!foro || foro === 'admin' || foro === 'ciudadanos' || foro === 'jsgritos'){
      foro = 'foroscomun';
    }
    if (foro.match(/[^\w\/]+/)){
      return;
    }
    Util.checkForms(()=>{
      this.history.push(foro !=='foroscomun' ? foro : '/');
      this.model.changeForo(foro, null);
      $('body').scrollTop(0);

    }, ()=>{
      if (this.history.length > 0){
        this.navigate(this.history[this.history.length-1], {replace:true});
      }
    });
  },

  mensaje(foro, mensajeId) {
    console.log(foro, mensajeId);
    if (foro === 'ciudadanos'){
      return this.foro(foro + '/' + mensajeId + '/');
    }
    if (mensajeId.match(/^\d+$/)){
      Util.checkForms(()=>{
        this.history.push(foro + '/' + mensajeId);
        this.model.changeForo(foro, mensajeId);
        setTimeout(()=>{
          $('body').animate({scrollTop:380}, 'slow');
        },1000);
      }, ()=>{
        if (this.history.length > 0){
          this.navigate(this.history[this.history.length-1], {replace: true});
        }
      });
    } else {
      this.foro(foro);
    }
  },
});

export default new Router();
