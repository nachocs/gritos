import Backbone from 'backbone';

export default Backbone.Model.extend({
  idAttribute: 'ID',
  changeForo(foro){
    this.set('ID', foro);
  },
});
