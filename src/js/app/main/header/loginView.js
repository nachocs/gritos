import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import template from './loginView-t.html';
import FbView from './fbView';
import endpoints from '../../util/endpoints';
import mockup from '../../util/mockups';
import Cookies from 'js-cookie';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(options) {
    this.model = options.userModel;
    this.fbView = new FbView();
    this.fbView.initialize();
    this.listenTo(this.model, 'change', this.render.bind(this));
    this.checkCookie();
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
  checkCookie(){
    const cookie = Cookies.get('city');
    const obj = JSON.parse(cookie);
    this.loginCall(obj);
  },
  loginCall(data){
    const self = this;
    $.ajax({
      type: 'POST',
      url: endpoints.apiUrl + 'login.cgi',
      data,
      success(data) {
        if (data.status !== 'ok') {
          console.log('error: ', data.status);
        } else {
          self.model.set(data.user);
          Cookies.set('city', {
            uid: data.uid,
          });
        }
      },
    });
  },
  submit(e) {
    e.preventDefault();
    const alias = this.$('#loginAlias').val(),
      password = this.$('#loginPassword').val();
    if ((alias.length < 1) || (password.length < 1)) {
      console.log('te olvidaste de poner algo'); // TODO
    } else {
      // mockup
      if (mockup.active){
        const data = mockup.loginMockup;
        this.model.set(data.user);
        return;
      } else {
        this.loginCall({
          alias,
          password,
        });
      }
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
