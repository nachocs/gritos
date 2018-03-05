import Backbone from 'backbone';

const GlobalModel = Backbone.Model.extend({
  idAttribute: 'ID',
  changeForo(ID, msg, isGallery, isVotaciones) {
    this.set({
      ID,
      msg,
      isGallery,
      isVotaciones,
    });
  },
});

export default new GlobalModel();