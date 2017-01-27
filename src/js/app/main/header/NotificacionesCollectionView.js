import Backbone from 'backbone';
import NotificacionesItemView from './NotificacionesItemView';
import NotificacionesCollection from '../../models/NotificacionesCollection';

export default Backbone.View.extend({
  itemView: NotificacionesItemView,
  tagName: 'ul',
  initialize(){
    this.collection = NotificacionesCollection;
    this.views = {};
  },
  render() {
    this.$el.html('');
    this.collection.each(function (model) {
      this.renderOne(model);
    }, this);
    return this;
  },
  renderOne(model) {
    const notificacionesItemView = new this.itemView({
      model,
      userModel: this.userModel,
    });
    this.views[model.id] = notificacionesItemView;
    this.$el.append(notificacionesItemView.render().el);
  },
});
