import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import template from 'text!./mainView-t.html';
import LoginView from './loginView';
const MsgCollectionView = require('./msgCollectionView');
export default Backbone.View.extend({
  initialize(options) {
    this.msgCollectionView = new MsgCollectionView({
      collection: this.collection,
      userModel: options.userModel,
    });
    this.listenTo(this.model, 'change:Name', _.bind(function () {
      this.collection.reset();
      this.collection.id = this.model.id;
      this.collection.fetch();
    }, this));
    this.userModel = options.userModel;
    this.loginView = new LoginView({
      userModel: this.userModel,
    });
    this.listenTo(this.model, 'sync', this.render.bind(this));
  },
  className: 'main',
  template: _.template(template),
  render() {
    this.$el.html(this.template(this.serializer()));
    this.$('.msg-list').replaceWith(this.msgCollectionView.render().el);
    this.$('.login-view').html(this.loginView.render().el);

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    return this;
  },
  afterRender() {
    componentHandler.upgradeElement(this.$el.find('.mdl-js-layout')[0]);
    componentHandler.upgradeElement(this.$el.find('.mdl-js-button')[0]);

    _.defer(_.bind(function () {
      // debugger;
      // $(window).scroll(function () {
      //     debugger;
      // });
      // $('*').scroll(function () {
      //     debugger;
      // });
      // $('body div').scroll(function () {
      //     debugger;
      // });
      // $('body div div').scroll(function () {
      //     debugger;
      // });
      // $('body div div div').scroll(function () {
      //     debugger;
      // });

      $('.mdl-layout__content').scroll(this.detect_scroll.bind(this));
    }, this));
  },
  detect_scroll(e) {
    if (($(e.currentTarget).scrollTop() + window.innerHeight) > ($('.msg-list').height() - 200)) {
      this.collection.nextPage();
    }
  },
  serializer() {
    return this.model.toJSON();
  },

});
