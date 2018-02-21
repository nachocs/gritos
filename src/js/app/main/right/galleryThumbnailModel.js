import Backbone from 'backbone';

export default Backbone.Model.extend({
  defaults: {},
  initialize() {
    // this.listenTo(this, 'change:indice', this.fetch.bind(this));
  },
  url() {
    return 'https://gritos.com/jsgritos/api/json.cgi?indice=' + this.get('indice') + '&encontrar=IMAGEN0_THUMB&max=1';
  },
  parse(response) {
    return {
      IMAGEN0_THUMB: response[0] ? response[0].IMAGEN0_THUMB : '',
    };
  },
});