import ViewBase from '../base/ViewBase';
import template from './galleryThumbnailView.html';
import _ from 'lodash';
import globalModel from '../../models/globalModel';
import GalleryThumbnailModel from './galleryThumbnailModel';
import router from '../../router';

//https://gritos.com/jsgritos/api/json.cgi?indice=gritos/avengers&encontrar=IMAGEN0_THUMB&max=1
//https://gritos.com/jsgritos/api/json.cgi?indice=ciudadanos/35331&encontrar=IMAGEN0_THUMB&max=1
export default ViewBase.extend({
  model: new GalleryThumbnailModel(),
  template: _.template(template),
  className: 'right-block',
  events: {
    'click .gotogallery': 'goToGallery',
  },
  goToGallery() {
    let ruta = '/' + globalModel.get('ID') + '/gallery';
    ruta = ruta.replace(/\/\//, '/');
    router.navigate(ruta, { trigger: true });
  },
  initialize() {
    this.listenTo(globalModel, 'change', () => {
      let id = globalModel.get('ID');
      if (id.match(/foroscomun/)) {
        id = null;
      } else if (id.match(/ciudadanos/)) {
        id = id.replace(/\/$/, '');
      } else {
        id = 'gritos/' + id;
      }
      this.model.set('indice', id);
      this.model.fetch({ cache: true });
    });
    this.listenTo(this.model, 'sync', this.render.bind(this));
  },
  render() {
    this.$el.html(this.template(this.model.toJSON()));
    this.delegateEvents();
    return this;
  },
});