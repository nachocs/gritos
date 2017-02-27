import Backbone from 'backbone';

const GlobalModel = Backbone.Model.extend({
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

export default new GlobalModel();
