import Backbone from 'backbone';
import _ from 'lodash';
import template from './modalView-t.html';
import FormView from './form/formView';
import SignUpView from './header/signUp';

const Model = Backbone.Model.extend({
  defaults: {
    show: false,
  },
});
const ModalView = Backbone.View.extend({
  model: new Model(),
  template: _.template(template),
  initialize() {
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  events: {
    'click .js-close': 'close',
    'click .js-action': 'runAction',
  },
  runAction() {
    if (this.action) {
      this.action();
    }
    this.close();
  },
  update(obj) {
    if (obj.model) {
      this.model.set(obj.model);
    }
    if (obj.action) {
      this.action = obj.action;
    }
    this.model.set('lite', true);
    if (obj.editForm) {
      this.model.set('lite', false);
      const EditForm = new FormView({
        userModel: obj.editForm.userModel,
        collection: obj.editForm.collection,
        msg: obj.editForm.msg,
        isHead: obj.editForm.isHead,
      });
      this.$('.modal-body').html(EditForm.render().el);
      this.action = EditForm.submitPost.bind(EditForm);
    }
    if (obj.signUp) {
      this.model.set('hideFooter', true);
      const SignUpForm = new SignUpView({
        close: this.close.bind(this),
      });
      this.$('.modal-body').html(SignUpForm.render().el);
      this.action = SignUpForm.submitPost.bind(SignUpForm);

    }
    this.undelegateEvents();
    this.delegateEvents();
  },
  close() {
    this.model.set('show', false);
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

export default new ModalView();