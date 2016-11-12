import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import MenuLoginView from './menuLoginView';
const template = require('text!./loginView-t.html');

export default Backbone.View.extend({
  template: _.template(template),
  initialize(options) {
    this.menuLoginView = new MenuLoginView();
    this.model = options.userModel;
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  events: {
    'click #loginSubmit': 'submit',
    'click input'(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    'click .login-menu-button': 'openMenu',
  },
  openMenu() {
    this.$('.login-menu').toggleClass('hidden');
  },
  submit() {
    const alias = this.$('#loginAlias').val(), pass = this.$('#loginPassword').val();
    if ((alias.length < 1) || (pass.length < 1)) {
      console.log('te olvidaste de poner algo'); // TODO
    } else {
      $.ajax({
        type: 'POST',
        url: 'api/login.cgi',
        data: {
          alias,
          password: pass,
        },
        success(data) {
          if (data.status !== 'ok') {
            console.log('error', data.status);
          }
        },
      });
    }
  },
  render() {
    const self = this;
    this.$el.html(this.template(this.model.toJSON()));
    _.defer(() => {
      self.$el.find('[class*=" mdl-js"]').each(function () {
        componentHandler.upgradeElement(this);
      });
    });

    this.delegateEvents();

    return this;
  },
});
