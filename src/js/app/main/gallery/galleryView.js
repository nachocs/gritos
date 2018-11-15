import ViewBase from '../base/ViewBase';
import GalleryCollection from './galleryCollection';
import $ from 'jquery';
import GalleryMsgView from './galleryMsgView';

export default ViewBase.extend({
  className: 'gallery',
  initialize() {
    this.collection = new GalleryCollection([]);
    this.views = {};

    // this.listenTo(this.collection, 'sync', this.render.bind(this));
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
    this.listenTo(this.collection, 'remove', this.removeOne.bind(this));

  },

  render() {
    this.$el.html('');
    this.collection.each((model) => {
      this.renderOne(model);
    });
    if ('object' == typeof this.el && this.el instanceof Element) {
      componentHandler.upgradeElement(this.el);
    }

    return this;
  },
  nextPage() {
    this.collection.nextPage();
  },
  renderOne(model) {
    if (!model.id) {
      return;
    }
    const msgView = new GalleryMsgView({
      model,
    });
    this.views[model.id] = msgView;
    const view = $(msgView.render().el).hide();
    view.appendTo(this.$el).slideDown('slow');
    // this.$el.append(msgView.render().el);
  },
  removeOne(model) {
    if (this.views[model.id]) {
      this.views[model.id].trigger('remove');
      delete this.views[model.id];
    }
  },
});