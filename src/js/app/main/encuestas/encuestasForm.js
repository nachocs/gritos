import Backbone from 'backbone';
import _ from 'lodash';
import template from './encuestasForm.html';

export default Backbone.View.extend({
  template: _.template(template),
  initialize() {
    this.model = new Backbone.Model({
      options: [
        { 0: '' },
        { 1: '' },
      ],
    });
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer() {
    return this.model.toJSON();
  },
});