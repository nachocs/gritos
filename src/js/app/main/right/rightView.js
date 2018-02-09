import ViewBase from '../base/ViewBase';
import template from './rightView.html';
import _ from 'lodash';

export default ViewBase.extend({
  template: _.template(template),
  initialize() {},
  render() {
    this.$el.html(this.template());
    return this;
  },
});