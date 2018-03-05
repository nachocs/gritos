import ViewBase from '../base/ViewBase';
import template from './rightView.html';
import _ from 'lodash';
import Backbone from 'backbone';
import globalModel from '../../models/globalModel';
import GalleryThumbnailView from './galleryThumbnailView';
import VotacionesThumbnailView from './votacionesThumbnailView';
// import router from '../../router';

//https://gritos.com/jsgritos/api/json.cgi?indice=gritos/avengers&encontrar=IMAGEN0_THUMB&max=1
//https://gritos.com/jsgritos/api/json.cgi?indice=ciudadanos/35331&encontrar=IMAGEN0_THUMB&max=1
export default ViewBase.extend({
  model: new Backbone.Model({}),
  template: _.template(template),
  events: {},
  className: 'right-side',
  initialize() {
    this.galleryThumbnailView = new GalleryThumbnailView({});
    this.votacionesThumbnailView = new VotacionesThumbnailView({});
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
      if (globalModel.get('isGallery')) {
        this.model.set('gallery', false);
      }
      if (globalModel.get('isVotaciones')) {
        this.model.set('votaciones', false);
      }
    });
    this.listenTo(this.model, 'change', () => {
      if (this.model.get('gallery') || this.model.get('votaciones')) {
        this.$el.removeClass('inactive').show();
      } else {
        this.$el.addClass('inactive').hide();
      }
      this.render();
    });
    this.listenTo(this.galleryThumbnailView.model, 'sync', () => {
      if (this.galleryThumbnailView.model.get('ID') && !globalModel.get('isGallery')) {
        this.model.set('gallery', true);
      } else {
        this.model.set('gallery', false);
      }
    });
    this.listenTo(this.votacionesThumbnailView.model, 'sync', () => {
      if (this.votacionesThumbnailView.model.get('ID') && !globalModel.get('isVotaciones')) {
        this.model.set('votaciones', true);
      } else {
        this.model.set('votaciones', false);
      }
    });
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    if (this.model.get('gallery')) {
      this.$('.gallery-thumbnail').html(this.galleryThumbnailView.render().el);
    }
    if (this.model.get('votaciones')) {
      this.$('.votaciones-thumbnail').html(this.votacionesThumbnailView.render().el);
    }
    this.delegateEvents();
    return this;
  },
  serializer() {
    return this.model.toJSON();
  },
});