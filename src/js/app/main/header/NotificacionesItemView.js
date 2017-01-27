import Backbone from 'backbone';
import template from './NotificacionesItemView-t.html';
import _ from 'lodash';

export default Backbone.View.extend({
  template: _.template(template),
  tagName: 'li',
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    return this.model.toJSON();
  },
});
