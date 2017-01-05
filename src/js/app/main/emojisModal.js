import Backbone from 'backbone';
import template from './emojisModal-t.html';
import _ from 'lodash';
import emojione from 'emojione';

export default Backbone.View.extend({
  initialize(){
    this.emojione = emojione;
  },
  template: _.template(template),
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    const list = [];
    Object.keys(this.emojione.emojioneList).forEach((emoji)=>{
      list.push(emojione.toImage(emoji));
    });
    return list;
  },
});
