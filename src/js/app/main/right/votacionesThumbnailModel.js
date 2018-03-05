import Backbone from 'backbone';
import _ from 'lodash';

export default Backbone.Model.extend({
  defaults: {},
  initialize() {
    // this.listenTo(this, 'change:indice', this.fetch.bind(this));
  },
  url() {
    return 'https://gritos.com/jsgritos/api/json.cgi?indice=' + this.get('indice') + '&encontrar=encuesta&max=1';
  },
  parse(response) {
    if (_.isempty(response[0])) {
      this.clear();
    } else {
      return response[0];
    }
    // {
    //   IMAGEN0_THUMB: response[0] ? response[0].IMAGEN0_THUMB : '',
    //   IMAGEN1_THUMB_URL: response[0] ? response[0].IMAGEN1_THUMB_URL : '',
    // };
  },
});