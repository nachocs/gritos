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
  defaultRoute() {
    return this.foro();
  },
  foro(foro) {
    if (!foro){
      foro = 'foroscomun';
    }
    this.model.set({
      Name: foro,
    });
    this.model.fetch();
  },

  mensaje(foro, mensajeId) {
    console.log(foro, mensajeId);
    debugger;
  },
});
