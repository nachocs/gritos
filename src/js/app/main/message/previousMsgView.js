import Backbone from 'backbone';
import _ from 'lodash';
import template from './previousMsgView-t.html';

export default Backbone.View.extend({
  template: _.template(template),
  initialize() {
    this.listenTo(this.collection, 'sync', () => {
      this.loading = false;
      this.render();
    });
    this.listenTo(this.collection, 'error', () => {
      this.loading = false;
      this.render();
    });
    this.listenTo(this.collection, 'request', () => {
      this.loading = true;
      this.render();
    });
  },
  events: {
    'click .load-previous': 'loadPrevious',
  },
  loadPrevious() {
    this.collection.nextPage();
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer() {
    if (this.collection) {
      return {
        firstEntry: this.collection.firstEntry,
        loading: this.loading,
        noMoreEntries: this.collection.noMoreEntries,
      };
    }
  },
});