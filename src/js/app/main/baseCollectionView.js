import Backbone from 'backbone';
import $ from 'jquery';

export default Backbone.View.extend({
  initialize(options) {
    this.userModel = options.userModel;
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
    $(this.el).scroll(() => {
      debugger;
    });

  },
  render() {
    this.$el.html('');
    this.collection.each(function (model) {
      this.renderOne(model);
    }, this);
    return this;
  },
  renderOne(model) {
    const msgView = new this.MsgView({
      model,
      userModel: this.userModel,
    });
    this.$el.append(msgView.render().el);
    componentHandler.upgradeElement(this.el);
  },
});
