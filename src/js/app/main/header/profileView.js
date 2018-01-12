import ViewBase from '../base/ViewBase';
import _ from 'lodash';
import template from './profileView.html';
import userModel from '../../models/userModel';

export default ViewBase.extend({
  template: _.template(template),
  events: {},
  initialize(options) {
    this.close = options.close;
    this.model = userModel;
  },

  submitPost() {},
  render() {
    this.$el.html(this.template(this.serializer()));
    this.materialDesignUpdate();
    this.delegateEvents();
    return this;
  },
  serializer() {
    return this.model.toJSON();
  },
});