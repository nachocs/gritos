import Backbone from 'backbone';
import template from './avisosView-t.html';
import _ from 'lodash';
import vent from '../../util/vent';
import ViewBase from '../base/ViewBase';

const Model = Backbone.Model.extend({
  // defaults:{
  //   room:'prueba',
  //   nuevos:1,
  // },
});

const AvisosView = ViewBase.extend({
  model: new Model(),
  template: _.template(template),
  events: {
    'click .avisos-main': 'closeThis',
  },
  closeThis() {
    this.model.set({ nuevos: 0 });
    this.goToRoute(this.model.get('room'));
  },
  initialize() {
    this.counters = {};
    this.listenTo(this.model, 'change', this.render.bind(this));
    vent.on('avisos', this.nuevoAviso.bind(this));
  },
  nuevoAviso(data) {
    if (data.room.match(/\//ig)) { return; }
    if (!this.counters[data.room]) {
      this.counters[data.room] = Number(data.entry.ID) - 1;
    }
    const diferencia = Number(data.entry.ID) - this.counters[data.room];
    this.model.set({ room: data.room.replace(/collection:/, ''), nuevos: diferencia });
    // setTimeout(()=>{
    // this.model.set({nuevos:0});
    // }, 5000);
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.delegateEvents();
    return this;
  },
  serializer() {
    return this.model.toJSON();
  },
});
export default new AvisosView;