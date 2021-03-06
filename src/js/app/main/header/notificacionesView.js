import Backbone from 'backbone';
import template from './notificacionesView-t.html';
import _ from 'lodash';
import $ from 'jquery';
import userModel from '../../models/userModel';
import NotificacionesCollectionView from './notificacionesCollectionView';
import NotificacionesCollection from '../../models/notificacionesCollection';
import NotificacionesUserModel from '../../models/notificacionesUserModel';

const Model = Backbone.Model.extend({
  defaults: {
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
  toggleNotificaciones() {
    this.model.set('show', !this.model.get('show'));
    this.model.set('counter', 0);
    if (this.model.get('show')) {
      NotificacionesCollection.forEach((model) => {
        const data = model.toJSON();
        if (data.tipo === 'msg') {
          const foro = data.indice + '/' + data.entry.ID;
          NotificacionesUserModel.update(data.tipo, foro, data.entry[data.subtipo], data.subtipo);
        }
        if (data.tipo === 'yo') {
          const foro = data.indice;
          NotificacionesUserModel.update(data.tipo, foro, data.entry.ID);
        }
        model.set('read', true);
      });
    }
  },
  initialize() {
    this.notificacionesCollectionView = new NotificacionesCollectionView();

    this.listenTo(this.model, 'change', this.render.bind(this));
    this.listenTo(userModel, 'change', (user) => {
      this.model.set('active', user.id ? true : false);
    });
    this.listenTo(NotificacionesCollection, 'add', () => {
      const notRead = NotificacionesCollection.filter((model) => !model.get('read'));
      this.model.set('counter', notRead.length);
    });
    this.listenTo(NotificacionesCollection, 'remove', () => {
      this.model.set('counter', NotificacionesCollection.length);
    });
    this.listenTo(this.model, 'change:show', (model) => {
      if (model.get('show')) {
        $('body').on('click.toggleNotificaciones', (e) => {
          if (!$(e.target).hasClass('notis-icon')) {
            if (this.model.get('show')) {
              this.model.set('show', false);
              $('body').off('click.toggleNotificaciones');
            }
          }
        });
      }
    });
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    // if (NotificacionesCollection.length>0){
    this.$('.notificaciones-collection-view').html(this.notificacionesCollectionView.render().el);
    // }
    this.delegateEvents();
    return this;
  },
  serializer() {
    return this.model.toJSON();
  },
});