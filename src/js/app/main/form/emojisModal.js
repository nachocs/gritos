import Backbone from 'backbone';
import template from './emojisModal-t.html';
import _ from 'lodash';
import emojis from '../../util/emojis';

const EmojisModal = Backbone.View.extend({
  initialize(){
    this.emojiList = emojis.emojis;
  },
  template: _.template(template),
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    // activity flags food modifier nature objects people regional symbols travel
    return this.emojiList;
  },
});
export default new EmojisModal();
