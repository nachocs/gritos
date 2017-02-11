import Backbone from 'backbone';
import ResumenItemView from './resumenItemView';
import _ from 'lodash';
import template from './resumenView-t.html';

const Model = Backbone.Model.extend({});

export default Backbone.View.extend({
  model: new Model(),
  className: 'mdl-navigation resumen-collection',
  tagName: 'nav',
  template: _.template(template),
  initialize() {
    this.views = {};
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    this.listenTo(this.collection, 'sync', this.render.bind(this));
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
    this.listenTo(this.collection, 'remove', this.removeOne.bind(this));
  },
  render() {
    this.$el.html(this.template(this.serializer()));
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
          href: '#' + model.get('name').replace(/gritos\//,'').replace(/foros\//,''),
        };
      },
    });
    this.views[model.id] = msgView;
    this.$el.append(msgView.render().el);
  },
  removeOne(model){
    if (this.views[model.id]){
      this.views[model.id].trigger('remove');
      delete this.views[model.id];
    }
  },
  serializer(){
    return this.model.toJSON();
  },
});
