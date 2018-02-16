import ViewBase from '../base/ViewBase';
import template from './rightView.html';
import _ from 'lodash';
import globalModel from '../../models/globalModel';
import GalleryThumbnailView from './galleryThumbnailView';

//https://gritos.com/jsgritos/api/json.cgi?indice=gritos/avengers&encontrar=IMAGEN0_THUMB&max=1
//https://gritos.com/jsgritos/api/json.cgi?indice=ciudadanos/35331&encontrar=IMAGEN0_THUMB&max=1
export default ViewBase.extend({
  template: _.template(template),
  initialize() {
    this.galleryThumbnailView = new GalleryThumbnailView({});
    this.listenTo(globalModel, 'change', () => {
      let id = globalModel.get('ID');
      if (id.match(/foroscomun/)) {
        id = null;
      } else if (id.match(/ciudadanos/)) {
        id = id.replace(/\/$/, '');
      } else {
        id = 'gritos/' + id;
      }
      if (id) {
        this.$el.show();
      } else {
        this.$el.hide();
      }
    });
  },
  render() {
    this.$el.html(this.template());
    this.$('.gallery-thumbnail').html(this.galleryThumbnailView.render().el);
    return this;
  },
});