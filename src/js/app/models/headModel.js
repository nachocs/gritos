import Backbone from 'backbone';
import _ from 'underscore';
import endpoints from '../endpoints';

export default Backbone.Model.extend({
  defaults: {
    Titulo: 'GRITOS.COM',
    INTRODUCCION: '',
  },
  idAttribute: 'Name',
  urlRoot: endpoints.apiUrl  + 'head.cgi',
  parse(resp){
    return _.isEmpty(resp) ? this.defaults : resp;
  },
});
