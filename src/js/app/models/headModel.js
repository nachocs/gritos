import Backbone from 'backbone';
export default Backbone.Model.extend({
  // url: function () {
  //     return 'http://gritos.com/jsgritos/api/head.cgi?' + this.id;
  // },
  idAttribute: 'Name',
  urlRoot: 'http://gritos.com/jsgritos/api/head.cgi',
});
