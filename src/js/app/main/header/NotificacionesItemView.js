import Backbone from 'backbone';
import template from './NotificacionesItemView-t.html';
import _ from 'lodash';
import userModel from '../../models/userModel';
import moment from 'moment';

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
        user: userModel.toJSON(),
        indiceBasic: this.model.get('indice').replace(/^gritos\//,'').replace(/^foros\//,'').replace(/\/.*$/,''),
        date: moment.unix(this.model.toJSON().entry.FECHA).fromNow(),
      },
    );
  },
});
