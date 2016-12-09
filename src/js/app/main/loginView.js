import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import template from './loginView-t.html';
import FbView from './fbView';
import endpoints from '../endpoints';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(options) {
    this.model = options.userModel;
    this.fbView = new FbView();
    this.fbView.initialize();
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  events: {
    'click #loginSubmit': 'submit',
    'click input'(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    'click .login-menu-button': 'openMenu',
    'click .fb-login': 'fBlogin',
  },
  fBlogin() {
    FB.login(response => {
      console.log('fb login response', response);
    }, {
      scope: 'public_profile,email',
    });
  },
  openMenu() {
    this.$('.login-menu').toggleClass('hidden');
  },
  submit(e) {
    e.preventDefault();
    const self = this;
    const alias = this.$('#loginAlias').val(), pass = this.$('#loginPassword').val();
    if ((alias.length < 1) || (pass.length < 1)) {
      console.log('te olvidaste de poner algo'); // TODO
    } else {
      $.ajax({
        type: 'POST',
        url: endpoints.apiUrl + 'login.cgi',
        data: {
          alias,
          password: pass,
        },
        success(data) {
          if (data.status !== 'ok') {
            console.log('error: ', data.status);
          }
          self.model.set(data.user);
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
