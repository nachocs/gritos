import Backbone from 'backbone';
import NotificacionesItemView from './notificacionesItemView';
import NotificacionesCollection from '../../models/notificacionesCollection';

export default Backbone.View.extend({
  itemView: NotificacionesItemView,
  tagName: 'ul',
  className: 'mdl-shadow--4dp',
  initialize() {
    this.collection = NotificacionesCollection;
    this.views = {};
    this.listenTo(NotificacionesCollection, 'add', this.renderOne.bind(this));

  },
  render() {
    this.$el.html((this.collection.length < 1) ? 'No tienes nuevas notificaciones' : '');
    this.collection.each((model) => {
      this.renderOne(model);
    });
    return this;
  },
  renderOne(model) {
    const notificacionesItemView = new this.itemView({
      model,
      userModel: this.userModel,
    });
    this.views[model.id] = notificacionesItemView;
    this.$el.prepend(notificacionesItemView.render().el);
  },
});