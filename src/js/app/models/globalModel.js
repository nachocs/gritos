import Backbone from 'backbone';

const GlobalModel = Backbone.Model.extend({
  idAttribute: 'ID',
  changeForo(ID, msg, isGallery) {
    console.log('isGallery', isGallery);
    this.set({
      ID,
      msg,
      isGallery,
    });
  },
});

export default new GlobalModel();