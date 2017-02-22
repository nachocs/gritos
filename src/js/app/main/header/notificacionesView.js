import Backbone from 'backbone';
import template from './notificacionesView-t.html';
import _ from 'lodash';
import userModel from '../../models/userModel';
import NotificacionesCollectionView from './notificacionesCollectionView';
import NotificacionesCollection from '../../models/NotificacionesCollection';
import NotificacionesUserModel from '../../models/notificacionesUserModel';

const Model = Backbone.Model.extend({
  defaults:{
    active: false,
    counter: 0,
    show: false,
  },
});
export default Backbone.View.extend({
  template: _.template(template),
  model: new Model,
  events: {
    'click': 'toggleNotificaciones',
  },
  toggleNotificaciones(){
    this.model.set('show', !this.model.get('show'));
    this.model.set('counter', 0);
    if (this.model.get('show')){
      NotificacionesCollection.forEach((model)=>{
        const data = model.toJSON();
        if (data.tipo === 'msg'){
          const foro = data.indice + '/' + data.entry.ID;
          NotificacionesUserModel.update(data.tipo, foro, data.entry[data.subtipo], data.subtipo);
        }
      });
    }
  },
  initialize(){
    this.notificacionesCollectionView = new NotificacionesCollectionView();

    this.listenTo(this.model, 'change', this.render.bind(this));
    this.listenTo(userModel, 'change', (user)=>{
      this.model.set('active', user.id ? true : false);
    });
    this.listenTo(NotificacionesCollection, 'add', ()=>{
      this.model.set('counter', NotificacionesCollection.length);
    });
    this.listenTo(NotificacionesCollection, 'remove', ()=>{
      this.model.set('counter', NotificacionesCollection.length);
    });
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    if (NotificacionesCollection.length>0){
      this.$('.notificaciones-collection-view').html(this.notificacionesCollectionView.render().el);
    }
    this.delegateEvents();
    return this;
  },
  serializer(){
    return this.model.toJSON();
  },
});
