import Backbone from 'backbone';
import $ from 'jquery';

export default Backbone.View.extend({
  initialize(options) {
    this.userModel = options.userModel;
    this.headModel = options.headModel;
    this.views = {};
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    // this.listenTo(this.collection, 'sync', this.render.bind(this));
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
  renderOne(model, collection, options) {
    if (!model.id) {
      return;
    }
    const msgView = new this.MsgView({
      model,
      userModel: this.userModel,
      headModel: this.headModel,
    });
    let reverse = this.reverse || false;
    if (options && (options.fromSocket || options.individual)) {
      reverse = !reverse;
    }
    this.views[model.id] = msgView;
    const view = $(msgView.render().el).hide();
    if (reverse) {
      view.prependTo(this.$el).slideDown('slow');
      // this.$el.prepend(msgView.render().el);
    } else {
      view.appendTo(this.$el).slideDown('slow');
      // this.$el.append(msgView.render().el);
    }
  },
  removeOne(model) {
    if (this.views[model.id]) {
      this.views[model.id].trigger('remove');
      delete this.views[model.id];
    }
  },
});