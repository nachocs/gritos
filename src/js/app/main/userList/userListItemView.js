import Backbone from 'backbone';
import template from './userListItemView.html';
import _ from 'lodash';
import router from '../../router';

export default Backbone.View.extend({
  template: _.template(template),
  tagName: 'li',
  events: {
    'click': 'goToUser',
  },
  initialize() {
    this.images = {
      default_dreamy: require('../../../../img/dreamy4.gif'),
    };
  },
  goToUser() {
    router.navigate('/ciudadanos/' + this.model.get('ID'), { trigger: true });
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.delegateEvents();
    return this;
  },
  serializer() {
    return Object.assign({},
      this.model.toJSON(), {
        images: this.images,
      }
    );
  },
});