import Backbone from 'backbone';
import template from './molaView-t.html';
import _ from 'lodash';
// import grinImage from '../../../../../node_modules/icomoon-free-npm/SVG/234-grin.svg';

export default Backbone.View.extend({
  template: _.template(template),
  className: 'mola-view',
  initialize(options) {
    this.userModel = options.userModel;
    this.listenTo(this.userModel, 'change', this.render.bind(this));
    this.listenTo(this.model, 'change:mola', this.render.bind(this));
    this.listenTo(this.model, 'change:nomola', this.render.bind(this));
    this.listenTo(this.model, 'change:love', this.render.bind(this));
  },
  events: {
    'click .action': 'molaAction',
  },
  molaAction(e) {
    e.stopPropagation();
    e.preventDefault();
    this.loading = true;
    this.model.fetch().done(() => {
      const mola = this.$(e.currentTarget).hasClass('mola') ? 'mola' : this.$(e.currentTarget).hasClass('nomola') ? 'nomola' : 'love';
      console.log('fetch', this.model.get(mola + 'log'));
      const modelObj = {};
      const array = this.model.get(mola + 'log') ? this.model.get(mola + 'log').split('|') : [];
      const newarray = [];
      let yaEstaba = false;
      array.forEach((ele) => {
        if (ele !== this.userModel.get('ID')) {
          newarray.push(ele);
        } else {
          yaEstaba = true; // si ya estaba lo quita
        }
      });
      if (!yaEstaba) { // si no estaba lo pone
        newarray.push(this.userModel.get('ID'));
      }
      modelObj[mola + 'log'] = newarray.join('|');
      // userObj[molaTag] = (!this.userModel.get(molaTag)) ? 1 : null;
      // this.userModel.save(userObj);
      modelObj[mola] = newarray.length;
      this.model.save(modelObj).done(() => {
        this.loading = false;
        this.render();
      });
      console.log('saved', this.model.get(mola + 'log'));
    });
  },
  render() {
    if (this.loading) {
      return this;
    }
    if (this.userModel && this.userModel.id) {
      this.$el.html(this.template(this.serializer()));
    }
    this.delegateEvents();
    return this;
  },
  serializer() {
    const arraymola = this.model.get('molalog') ? this.model.get('molalog').split('|') : [];
    const currentMola = !!(arraymola.indexOf(this.userModel.get('ID')) > -1);
    const arraynomola = this.model.get('nomolalog') ? this.model.get('nomolalog').split('|') : [];
    const currentNomola = !!(arraynomola.indexOf(this.userModel.get('ID')) > -1);
    const arraylove = this.model.get('lovelog') ? this.model.get('lovelog').split('|') : [];
    const currentLove = !!(arraylove.indexOf(this.userModel.get('ID')) > -1);
    return _.extend({},
      this.model.toJSON(), {
        currentMola,
        currentNomola,
        currentLove,
        // grinImage,
      });
  },
  clean(string) {
    return string.replace(/\//ig, '.');
  },

});