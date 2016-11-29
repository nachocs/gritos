import Backbone from 'backbone';
import _ from 'underscore';

export default Backbone.Model.extend({
  defaults: {
    Titulo: 'GRITOS.COM',
    INTRODUCCION: '',
  },
  idAttribute: 'Name',
  urlRoot: 'http://gritos.com/jsgritos/api/head.cgi',
  parse(resp){
    return _.isEmpty(resp) ? this.defaults : resp;
  },
});
