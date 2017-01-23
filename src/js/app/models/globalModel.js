import Backbone from 'backbone';

export default Backbone.Model.extend({
  idAttribute: 'ID',
  changeForo(ID, msg){
    this.set(
      {
        ID,
        msg,
      }
    );
  },
});
