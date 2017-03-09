import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import router from '../../router';

export default Backbone.View.extend({
  materialDesignUpdate(){
    const self = this;
    _.defer(() => {
      self.$el.find('[class*=" mdl-js"]').each(function () {
        componentHandler.upgradeElement(this);
      });
    });
  },
  goToLink(e){
    const route = $(e.currentTarget).data('link');
    this.goToRoute(route);
  },
  goToRoute(route){
    router.navigate(route, {trigger:true});
    $('main').scrollTop(0);
  },

});
