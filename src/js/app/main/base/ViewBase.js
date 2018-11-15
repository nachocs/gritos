import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import router from '../../router';
// import Util from '../../util/util';

export default Backbone.View.extend({
  materialDesignUpdate() {
    const self = this;
    _.defer(() => {
      if (self && self.$el) {
        self.$el.find('[class*=" mdl-js"]').each(function () {
          componentHandler.upgradeElement(this);
        });
      }
    });
  },
  goToLink(e) {
    const route = $(e.currentTarget).data('link');
    // Util.checkForms(()=>{
    this.goToRoute(route);
    // });
  },
  goToRoute(route) {
    router.navigate(route, { trigger: true });
  },
});