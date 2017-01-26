import Backbone from 'backbone';
import template from './notificacionesView-t.html';
import _ from 'lodash';
import userModel from '../../models/userModel';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(){
    this.active = false;
    this.listenTo(userModel, 'change', (user)=>{
      this.active = user.id?true:false;
      this.render();
    });
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    return {
      active: this.active,
    };
  },
});
