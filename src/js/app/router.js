import Backbone from 'backbone';

export default Backbone.Router.extend({
  routes: {
    ':foro': 'foro',
    ':foro/:id': 'mensaje',
    '*something': 'defaultRoute',
  },
  initialize(options) {
    this.model = options.model;
    // options.collection.fetch();
  },
  defaultRoute(route) {
    if (route && route.length>0){
      const [, foro, entrada] = route.match(/(.*)\/(\d+)/);
      if (foro && entrada){
        return this.mensaje(foro, entrada);
      }
    }
    return this.foro();
  },
  foro(foro) {
    if (!foro){
      foro = 'foroscomun';
    }
    this.model.changeForo(foro, null);
  },

  mensaje(foro, mensajeId) {
    console.log(foro, mensajeId);
    if (foro === 'ciudadanos'){
      return this.foro(foro + '/' + mensajeId + '/');
    }
    this.model.changeForo(foro, mensajeId);
  },
});
