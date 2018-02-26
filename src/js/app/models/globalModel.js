import Backbone from 'backbone';

const GlobalModel = Backbone.Model.extend({
  idAttribute: 'ID',
  changeForo(ID, msg, isGallery) {
    this.set({
      ID,
      msg,
      isGallery,
    });
  },
});

export default new GlobalModel();