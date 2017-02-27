import Backbone from 'backbone';
import _ from 'lodash';

export default Backbone.View.extend({
  materialDesignUpdate(){
    const self = this;
    _.defer(() => {
      self.$el.find('[class*=" mdl-js"]').each(function () {
        componentHandler.upgradeElement(this);
      });
    });
  },
});
