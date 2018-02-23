import ViewBase from '../base/ViewBase';
import globalModel from '../../models/globalModel';
import GalleryCollection from './galleryCollection';
import $ from 'jquery';
import GalleryMsgView from './galleryMsgView';

export default ViewBase.extend({
  initialize() {
    this.collection = new GalleryCollection([]);
    this.views = {};
    this.listenTo(globalModel, 'change:isGallery', () => {
      if (globalModel.get('isGallery')) {
        this.collection.fetch();
      }
    });
  },
  render() {
    this.$el.html('');
    this.collection.each((model) => {
      this.renderOne(model);
    });
    componentHandler.upgradeElement(this.el);
    return this;
  },
  renderOne(model) {
    if (!model.id) { return; }
    const msgView = new GalleryMsgView({
      model,
    });
    this.views[model.id] = msgView;
    const view = $(msgView.render().el).hide();
    view.appendTo(this.$el).slideDown('slow');
    // this.$el.append(msgView.render().el);
  },
});