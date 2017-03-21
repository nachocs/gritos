import Backbone from 'backbone';
import template from './resumenItemView-t.html';
import _ from 'lodash';

export default Backbone.View.extend({
  tagName: 'span',
  className: 'mdl-navigation__link',
  attributes: {},
  template: _.template(template),
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    return Object.assign({},
      this.model.toJSON(),
      {
        name:this.model.get('name')?this.model.get('name').replace(/gritos\//,'').replace(/foros\//,''):'',
      }
    );
  },

});
