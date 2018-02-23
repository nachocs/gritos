import ViewBase from '../base/ViewBase';
import template from './galleryMsgView.html';
import _ from 'lodash';

export default ViewBase.extend({
  template: _.template(template),
  className: 'gallery-entry',
  initialize() {},
  render() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },

});