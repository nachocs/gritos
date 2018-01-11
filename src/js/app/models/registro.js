import Backbone from 'backbone';
import endpoints from '../util/endpoints';

export default Backbone.Model.extend({
  url() {
    return endpoints.apiUrl + 'registro.cgi';
  },
});