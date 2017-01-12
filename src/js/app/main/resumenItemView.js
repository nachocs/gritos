import Backbone from 'backbone';
import template from './resumenItemView-t.html';
import _ from 'lodash';

export default Backbone.View.extend({
  template: _.template(template),
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    return this.model.toJSON();
  },

});
