import Backbone from 'backbone';
import template from './spinnerView.html';
import _ from 'underscore';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(){
    this.listenTo(this.collection, 'sync', () => {
      this.hideSpinner();
    });
    this.listenTo(this.collection, 'error', () => {
      this.hideSpinner();
    });
    this.listenTo(this.collection, 'request', () => {
      this.showSpinner();
    });
  },
  showSpinner(){
    console.log('show');
    this.$el.find('.spinner-main').show();
  },
  hideSpinner(){
    console.log('hide');
    this.$el.find('.spinner-main').hide();
  },
  render(){
    this.$el.html(this.template());
    return this;
  },
});
