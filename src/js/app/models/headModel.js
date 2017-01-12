import Backbone from 'backbone';
import _ from 'lodash';
import endpoints from '../endpoints';

export default Backbone.Model.extend({
  initialize(values, options){
    this.globalModel = options.globalModel;
    this.listenTo(this.globalModel, 'change:ID', this.update.bind(this));
  },
  defaults: {
    Titulo: 'gritos.com',
    INTRODUCCION: '',
  },
  idAttribute: 'Name',
  urlRoot: endpoints.apiUrl  + 'head.cgi?',
  parse(resp){
    return _.isEmpty(resp) ? this.defaults : resp;
  },
  update(){
    this.set({
      Name: this.globalModel.get('ID'),
    });
    this.fetch();
  },

});
