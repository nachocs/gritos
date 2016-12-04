import Backbone from 'backbone';

export default  Backbone.Model.extend({
  url: 'http://gritos.com/jsgritos/api/post.cgi',
  defaults: {
  },
});
