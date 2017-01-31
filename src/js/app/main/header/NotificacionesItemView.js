import Backbone from 'backbone';
import template from './NotificacionesItemView-t.html';
import _ from 'lodash';
import userModel from '../../models/userModel';

export default Backbone.View.extend({
  template: _.template(template),
  tagName: 'li',
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    return Object.assign({},
      this.model.toJSON(), {
        user:userModel.toJSON(),
      },
    );
  },
});
