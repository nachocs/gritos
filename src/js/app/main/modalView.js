import Backbone from 'backbone';
import _ from 'lodash';
import template from './modalView-t.html';

const Model = Backbone.Model.extend({
  defaults:{
    show: false,
  },
});
const ModalView = Backbone.View.extend({
  model: new Model(),
  template: _.template(template),
  initialize(){
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  events:{
    'click .js-close': 'close',
    'click .js-action': 'runAction',
  },
  runAction(){
    if (this.action){
      this.action();
    }
    this.close();
  },
  update(obj){
    if (obj.model){
      this.model.set(obj.model);
    }
    if (obj.action){
      this.action = obj.action;
    }
    this.undelegateEvents();
    this.delegateEvents();
  },
  close(){
    this.model.set('show', false);
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    this.delegateEvents();
    return this;
  },
  serializer(){
    return this.model.toJSON();
  },
});

export default new ModalView();
