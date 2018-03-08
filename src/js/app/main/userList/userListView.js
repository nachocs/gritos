import Backbone from 'backbone';
// import $ from 'jquery';
import UserListItemView from './userListItemView';
import userListcollection from '../../models/userListCollection';
import template from './userListView.html';
import _ from 'lodash';

export default Backbone.View.extend({
  template: _.template(template),
  model: new Backbone.Model({}),
  className: 'user-list',
  initialize(options) {
    this.views = {};
    if (options.userlisthead) {
      this.model.set('userlisthead', options.userlisthead);
    } else {
      this.model.set('userlisthead', '');
    }
    this.collection = new userListcollection([], options);
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
    this.listenTo(this.collection, 'remove', this.removeOne.bind(this));

    this.listenTo(this.collection, 'sync', () => {
      this.model.set('loading', false);
    });
    this.listenTo(this.collection, 'error', () => {
      this.model.set('loading', false);
    });
    this.listenTo(this.collection, 'request', () => {
      this.model.set('loading', true);
    });
    this.listenTo(this.model, 'change', this.render.bind(this));
    _.bindAll(this);
    console.log(this);

  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.collection.each((model) => {
      this.renderOne(model);
    });
    return this;
  },
  renderOne(model) {
    if (!model.id) { return; }
    const msgView = new UserListItemView({
      model,
    });
    this.views[model.id] = msgView;
    // const view = $(msgView.render().el).hide();
    // view.appendTo(this.$el.find('.user-list-content')).slideDown('slow');
    this.$el.find('.user-list-content').append(msgView.render().el);
  },
  removeOne(model) {
    if (this.views[model.id]) {
      this.views[model.id].trigger('remove');
      delete this.views[model.id];
    }
  },
  serializer() {
    return this.model.toJSON();
  },
  clean() {
    this.collection.each((model) => {
      this.removeOne(model);
    });
    delete this.collection;
    delete this.views;
    this.remove();
  },
});