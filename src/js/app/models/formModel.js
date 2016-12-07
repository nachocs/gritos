import Backbone from 'backbone';
import endpoints from '../endpoints';

export default  Backbone.Model.extend({
  url: endpoints.apiUrl + 'post.cgi',
  defaults: {
  },
});
