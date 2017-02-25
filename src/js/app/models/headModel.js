import Backbone from 'backbone';
import _ from 'lodash';
import endpoints from '../util/endpoints';

export default Backbone.Model.extend({
  initialize(values, options){
    this.globalModel = options.globalModel;
    this.listenTo(this.globalModel, 'change:ID', this.update.bind(this));
  },
  defaults: {
    Titulo: 'gritos.com',
    INTRODUCCION: '',
    INDICE: '',
    Userid: null,
    IMAGEN0_URL:null,
  },
  idAttribute: 'Name',
  urlRoot: endpoints.apiUrl  + 'head.cgi?',
  parse(resp){
    return _.isEmpty(resp) ? this.defaults : resp;
  },
  update(){
    this.clear();
    this.set({
      Name: this.globalModel.get('ID'),
    });
    this.fetch();
  },

});
