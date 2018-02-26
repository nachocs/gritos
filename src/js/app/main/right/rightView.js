import ViewBase from '../base/ViewBase';
import template from './rightView.html';
import _ from 'lodash';
import globalModel from '../../models/globalModel';
import GalleryThumbnailView from './galleryThumbnailView';
import router from '../../router';

//https://gritos.com/jsgritos/api/json.cgi?indice=gritos/avengers&encontrar=IMAGEN0_THUMB&max=1
//https://gritos.com/jsgritos/api/json.cgi?indice=ciudadanos/35331&encontrar=IMAGEN0_THUMB&max=1
export default ViewBase.extend({
  template: _.template(template),
  events: {
    'click .gotogallery': 'goToGallery',
  },
  className: 'right-side',
  initialize() {
    this.galleryThumbnailView = new GalleryThumbnailView({});
    this.listenTo(globalModel, 'change', () => {
      this.id = globalModel.get('ID');
      if (this.id.match(/foroscomun/)) {
        this.id = null;
      } else if (this.id.match(/ciudadanos/)) {
        this.id = this.id.replace(/\/$/, '');
      } else {
        this.id = 'gritos/' + this.id;
      }
      if (this.id) {
        this.$el.removeClass('inactive').show();
      } else {
        this.$el.addClass('inactive').hide();
      }
    });
    this.listenTo(this.galleryThumbnailView.model, 'change', () => {
      if (!this.galleryThumbnailView.model.get('ID')) {
        this.$el.addClass('inactive').hide();
      } else {
        this.$el.removeClass('inactive').show();
      }
    });
  },
  goToGallery() {
    let ruta = '/' + globalModel.get('ID') + '/gallery';
    ruta = ruta.replace(/\/\//, '/');
    router.navigate(ruta, { trigger: true });
  },
  render() {
    this.$el.html(this.template({ id: this.id }));
    this.$('.gallery-thumbnail').html(this.galleryThumbnailView.render().el);
    this.delegateEvents();
    return this;
  },
});