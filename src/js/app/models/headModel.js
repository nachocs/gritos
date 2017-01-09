import Backbone from 'backbone';
import _ from 'lodash';
import endpoints from '../endpoints';

export default Backbone.Model.extend({
  defaults: {
    Titulo: 'gritos.com',
    INTRODUCCION: '',
  },
  idAttribute: 'Name',
  urlRoot: endpoints.apiUrl  + 'head.cgi?',
  parse(resp){
    return _.isEmpty(resp) ? this.defaults : resp;
  },
});
