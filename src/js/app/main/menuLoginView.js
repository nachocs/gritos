import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import template from 'text!./menuLoginView-t.html';

export default Backbone.View.extend({
  id: 'menuLogin',
  template: _.template(template),
  initialize() {},
  events: {
    'click #loginSubmit': 'submit',
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
            console.log('error ', data.status);
          }
        },
      });
    }
  },
  render() {
    this.$el.html(this.template());
    componentHandler.upgradeElement(this.$el.find('.mdl-js-button')[0]);
    componentHandler.upgradeElement(this.$el.find('.mdl-js-ripple-effect')[0]);

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    return this;
  },
  afterRender() {},
});
