import Backbone from 'backbone';
import endpoints from '../util/endpoints';
const resumenModel = Backbone.Model.extend({
  idAttribute: 'name',
});
export default Backbone.Collection.extend({
  model: resumenModel,
  url() {
    return endpoints.apiUrl + 'resumen.cgi?';
  },
  parse(resp) {
    return resp;
  },
});
