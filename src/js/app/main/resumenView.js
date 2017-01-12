import Backbone from 'backbone';
import ResumenItemView from './resumenItemView';

export default Backbone.View.extend({
  className: 'mdl-navigation resumen-collection',
  tagName: 'nav',
  initialize() {
    this.views = {};
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    this.listenTo(this.collection, 'sync', this.render.bind(this));
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
    this.listenTo(this.collection, 'remove', this.removeOne.bind(this));
  },
  render() {
    this.$el.html('');
    this.collection.each(function (model) {
      this.renderOne(model);
    }, this);
    componentHandler.upgradeElement(this.el);
    return this;
  },
  renderOne(model) {
    const msgView = new ResumenItemView({
      model,
      attributes:()=> {
        return{
          href: model.get('name'),
        };
      },
    });
    this.views[model.id] = msgView;
    if (this.reverse){
      this.$el.prepend(msgView.render().el);
    } else {
      this.$el.append(msgView.render().el);
    }
  },
  removeOne(model){
    if (this.views[model.id]){
      this.views[model.id].trigger('remove');
      delete this.views[model.id];
    }
  },
});
