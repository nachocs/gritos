import Backbone from 'backbone';
import template from './molaView-t.html';
import _ from 'lodash';

export default Backbone.View.extend({
  template: _.template(template),
  className: 'mola',
  initialize(options) {
    this.userModel = options.userModel;
    this.listenTo(this.userModel, 'change', this.render.bind(this));
    this.listenTo(this.model, 'change:mola', this.render.bind(this));
    this.listenTo(this.model, 'change:nomola', this.render.bind(this));
  },
  events: {
    'click i': 'molaAction',
  },
  molaAction(e) {
    const mola = this.$(e.currentTarget).hasClass('mola') ? 'mola' : 'nomola', molaTag = `${mola}.${this.clean(this.model.get('INDICE') + '.' + this.model.id)}`, userObj = {}, modelObj = {};
    userObj[molaTag] = (!this.userModel.get(molaTag)) ? 1 : null;
    this.userModel.save(userObj);
    modelObj[mola] = Number(this.model.get(mola) || 0) + (userObj[molaTag] ? 1 : -1);
    this.model.save(modelObj);
  },
  render() {
    if (this.userModel && this.userModel.id) {
      this.$el.html(this.template(this.serializer()));
    }
    return this;
  },
  serializer() {
    return _.extend({},
      this.model.toJSON(), {
        user: this.userModel.toJSON(),
        currentMola: this.userModel.get(`mola.${this.clean(this.model.get('INDICE') + '.' + this.model.id)}`),
        currentNomola: this.userModel.get(`nomola.${this.clean(this.model.get('INDICE') + '.' + this.model.id)}`),
      });
  },
  clean(string) {
    return string.replace(/\//ig, '.');
  },

});