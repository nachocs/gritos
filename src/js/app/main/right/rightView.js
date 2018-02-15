import ViewBase from '../base/ViewBase';
import template from './rightView.html';
import _ from 'lodash';


//https://gritos.com/jsgritos/api/json.cgi?indice=gritos/avengers&encontrar=IMAGEN0_THUMB&max=1
export default ViewBase.extend({
  template: _.template(template),
  initialize() {},
  render() {
    this.$el.html(this.template());
    return this;
  },
});