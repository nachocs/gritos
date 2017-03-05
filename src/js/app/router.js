import Backbone from 'backbone';
import GlobalModel from './models/globalModel';

const Router = Backbone.Router.extend({
  routes: {
    ':foro(/)': 'foro',
    ':foro/:id(/)': 'mensaje',
    '*something': 'defaultRoute',
  },
  initialize() {
    this.model = GlobalModel;
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
    this.model.changeForo(foro, null);
  },

  mensaje(foro, mensajeId) {
    console.log(foro, mensajeId);
    if (foro === 'ciudadanos'){
      return this.foro(foro + '/' + mensajeId + '/');
    }
    if (mensajeId.match(/^\d+$/)){
      this.model.changeForo(foro, mensajeId);
    } else {
      this.foro(foro);
    }
  },
});

export default new Router();
