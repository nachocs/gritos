import Backbone from 'backbone';
import _ from 'lodash';
import endpoints from '../util/endpoints';

export default Backbone.Model.extend({
  initialize(values, options){
    if (options){
      this.globalModel = options.globalModel;
    }
    if (this.globalModel){
      this.listenTo(this.globalModel, 'change:ID', this.update.bind(this));
    }
  },
  defaults: {
    Titulo: 'gritos.com',
    INTRODUCCION: '<div>Expresa libremente y sin ningún tipo de tapujos tu opinión sobre el tema que quieras.&nbsp;</div><div><font size="1">Tus opiniones serán enviadas al HQ de la C.I.A., allí harán un correcto uso de ellas.</font></div>',
    INDICE: '',
    Userid: null,
    IMAGEN0_URL: null,
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
