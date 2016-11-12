import Backbone from 'backbone';
export default Backbone.Router.extend({
  routes: {
    ':foro': 'foro',
    ':foro/:id': 'mensaje'
  },
  initialize(options) {
    this.model = options.model;
    // options.collection.fetch();
  },
  foro(foro) {
    this.model.set({
      Name: foro
    });
    this.model.fetch();
  },
  mensaje(foro, mensajeId) {
    debugger;
  }
});
