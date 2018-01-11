import ViewBase from '../base/ViewBase';
import _ from 'lodash';
import template from './signUp.html';
import Backbone from 'backbone';
import endpoints from '../../util/endpoints';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/operator/map';
import { Subscription } from 'rxjs/Subscription';
import Cookies from 'js-cookie';
import userModel from '../../models/userModel';
import RegistroModel from '../../models/registro';

export default ViewBase.extend({
  template: _.template(template),
  events: {
    'keyup #signupAlias': 'validateAlias',
    'keyup #signupEmail': 'validateEmail',
    'keyup #signupPassword': 'validatePassword',
    'click #signupSubmit': 'submitPost',
  },
  initialize(options) {
    this.close = options.close;
    this.model = new Backbone.Model({});
    this.subscription = new Subscription();
    this.formValid = {};
    this.checkValueSubscription = {};
    // this.listenTo(this.model, 'change', this.render.bind(this));
  },
  validatePassword(e) {
    const password = e.currentTarget.value;
    this.$('.valid-password').removeClass('active');
    this.validForm('password', false);
    if (password && (password.length < 8)) {
      this.$('.error-password').html('password de 8 characteres al menos, porfa').addClass('active');
    } else if (password) {
      this.$('.error-password').html('').removeClass('active');
      this.$('.valid-password').addClass('active');
      this.validForm('password', true);
    }
  },
  validateEmail(e) {
    const email = e.currentTarget.value;
    this.model.set('alias', email);
    this.$('.valid-email').removeClass('active');
    this.$('.error-email').removeClass('active');
    const EMAIL_REGEXP = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    const emailValid = EMAIL_REGEXP.test(email) ? true : false;
    this.validForm('email', false);
    if (email && (email.length < 4 || !emailValid)) {
      this.$('.error-email').html('email no vale').addClass('active');
    } else if (email) {
      this.$('.error-email').html('').removeClass('active');
      this.checkValue('email', email);
    }
  },
  validateAlias(e) {
    const alias = e.currentTarget.value;
    this.model.set('alias', alias);
    this.$('.valid-alias').removeClass('active');
    this.$('.error-alias').removeClass('active');
    this.validForm('alias', false);

    if (alias && alias.length < 4) {
      this.$('.error-alias').html('Alias mu corto').addClass('active');
    } else if (alias) {
      this.$('.error-alias').html('').removeClass('active');
      this.checkValue('alias', alias);
    }
  },
  validForm(key, value) {
    this.formValid[key] = value;
    if (this.formValid.alias && this.formValid.email && this.formValid.password) {
      this.$('#signupSubmit').prop('disabled', false);
    } else {
      this.$('#signupSubmit').prop('disabled', true);
    }
  },
  checkValue(indice, value) {
    if (this.checkValueSubscription[indice]) {
      this.checkValueSubscription[indice].unsubscribe();
    }
    this.$('.valid-' + indice + '-load').addClass('active');
    const gets$ = Observable
      .ajax(endpoints.apiUrl + 'check.cgi?indice=' + indice + '&value=' + value)
      .map(e => e.response);

    this.checkValueSubscription[indice] = gets$
      .subscribe(data => {
        this.$('.valid-' + indice + '-load').removeClass('active');
        if (data.status === 'disponible') {
          this.$('.error-' + indice).html('').removeClass('active');
          this.$('.valid-' + indice).addClass('active');
          this.validForm(indice, true);
        } else {
          this.$('.error-' + indice).html('El ' + indice + ' ya est&aacute; pillao').addClass('active');
          this.$('.valid-' + indice).removeClass('active');
          this.validForm(indice, false);
        }
      });
    this.subscription.add(this.checkValueSubscription[indice]);

  },

  submitPost(e) {
    e.preventDefault();
    e.stopPropagation();
    const self = this;
    this.$('.valid-submit-load').addClass('active');
    const body = {
      alias: this.$('#signupAlias').val(),
      email: this.$('#signupEmail').val(),
      password: this.$('#signupPassword').val(),
    };
    const registroModel = new RegistroModel();
    registroModel.save(body, {
      success(model, data) {
        self.$('.valid-submit-load').removeClass('active');
        console.log(data);
        if (data.status !== 'ok') {
          const error = data.status || data.error;
          console.log('error: ', error);
          Cookies.set('city', null);
          self.$('.error-submit').html('error! ' + error).addClass('active');
        } else {
          userModel.set(data.user);
          Cookies.set('city', {
            uid: data.uid,
          });
          self.close();
        }
      },
      error(model, error) {
        console.log('server error: ', error);
        this.$('.valid-submit-load').removeClass('active');
      },
    });
  },
  render() {
    this.$el.html(this.template(this.model.toJSON()));
    this.materialDesignUpdate();
    this.delegateEvents();
    return this;
  },
});