import Backbone from 'backbone';
import _ from 'lodash';
import template from './encuestasForm.html';

export default Backbone.View.extend({
  template: _.template(template),
  initialize() {
    const encuestasModel = Backbone.Model.extend({
      defaults: {
        options: [{
          id: 1,
          value: '',
        }],
      },
    });
    this.model = new encuestasModel({});
  },
  events: {
    'keydown input': 'onKeyDown',
    'click .encuesta-cierra-opcion': 'cierraOpcion',
  },
  cierraOpcion(e) {
    const opc = this.$(e.currentTarget).data('opcion');
    let options = this.model.get('options');
    options = options.filter((option) => Number(option.id) !== Number(opc));
    this.model.set('options', options);
    this.render();
  },
  onKeyDown(e) {
    if (e.keyCode === 13) {
      const targetOpt = Number(this.$(e.currentTarget).attr('name'));
      const options = this.model.get('options');
      let lastOption;
      options.forEach((option) => {
        option.value = this.$('[name=' + option.id + ']').val();
        lastOption = Number(option.id);
      });
      if (targetOpt === lastOption) {
        const newId = lastOption + 1;
        options.push({
          id: newId,
          value: '',
        });
        this.model.set('options', options);
        this.render();
        this.$('[name=' + newId + ']').focus();
      } else {
        const nextFocus = targetOpt + 1;
        this.$('[name=' + nextFocus + ']').focus();
      }
    } else {
      const self = this;
      setTimeout(() => {
        const opt = [];
        self.$('[name]').each((index, element) => {
          opt.push({
            id: element.name,
            value: element.value,
          });
          self.model.set('options', opt);
        });
      });
    }
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer() {
    return this.model.toJSON();
  },
});