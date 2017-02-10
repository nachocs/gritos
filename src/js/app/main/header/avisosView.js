import Backbone from 'backbone';
import template from './avisosView-t.html';
import _ from 'lodash';
import vent from '../../util/vent';

const Model = Backbone.Model.extend({
  // defaults:{
  //   room:'prueba',
  //   nuevos:1,
  // },
});

const AvisosView = Backbone.View.extend({
  model: new Model(),
  template: _.template(template),
  initialize(){
    this.counters = {};
    this.listenTo(this.model, 'change', this.render.bind(this));
    vent.on('avisos', this.nuevoAviso.bind(this));
  },
  nuevoAviso(data){
    if (data.room.match(/\//ig)){return;}
    if (!this.counters[data.room]){
      this.counters[data.room] = Number(data.entry.ID) - 1;
    }
    const diferencia = Number(data.entry.ID)-this.counters[data.room];
    this.model.set({room:data.room, nuevos: diferencia});
    setTimeout(()=>{
      this.model.set({nuevos:0});
    }, 5000);
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    return this.model.toJSON();
  },
});
export default new AvisosView;
