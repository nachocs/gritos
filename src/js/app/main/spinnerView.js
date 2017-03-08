import Backbone from 'backbone';
import template from './spinnerView.html';
import _ from 'lodash';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(){
    this.listenTo(this.collection, 'sync', () => {
      this.hideSpinner();
    });
    this.listenTo(this.collection, 'error', () => {
      this.hideSpinner();
    });
    this.listenTo(this.collection, 'destroy', () => {
      this.hideSpinner();
    });
    this.listenTo(this.collection, 'request', () => {
      this.showSpinner();
    });
  },
  showSpinner(){
    this.$el.find('.mdl-spinner').addClass('is-active');
    componentHandler.upgradeElement(this.$el.find('.mdl-spinner')[0]);
  },
  hideSpinner(){
    this.$el.find('.mdl-spinner').removeClass('is-active');
    componentHandler.upgradeElement(this.$el.find('.mdl-spinner')[0]);
  },
  render(){
    this.$el.html(this.template());
    componentHandler.upgradeElement(this.$el.find('.mdl-spinner')[0]);
    return this;
  },
});
