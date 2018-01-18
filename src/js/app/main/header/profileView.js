import ViewBase from '../base/ViewBase';
import _ from 'lodash';
import template from './profileView.html';
import userModel from '../../models/userModel';
import DreamysService from '../../util/dreamysService';

export default ViewBase.extend({
  template: _.template(template),
  events: {},
  initialize(options) {
    this.close = options.close;
    this.model = userModel;
    // this.getDreamys();
    this.publicDreamys = [];
    this.personalDreamys = [];
    this.personalLoader = true;
    this.publicLoader = true;
    DreamysService.getGeneralDreamys().subscribe((data => {
      this.publicLoader = false;
      this.publicDreamys = data;
      this.render();
    }));
    if (this.model.get('uid')) {
      DreamysService.getPersonalDreamys().subscribe((data => {
        this.personalLoader = false;
        this.personalDreamys = data;
        this.render();
      }));
      DreamysService.fetchGeneralDreamys();
      DreamysService.fetchPersonalDreamys(this.model.get('NID'));
    }
  },
  submitPost() {},
  render() {
    this.$el.html(this.template(this.serializer()));
    this.materialDesignUpdate();
    this.delegateEvents();
    return this;
  },
  serializer() {
    return Object.assign({},
      this.model.toJSON(), {
        personalDreamys: this.personalDreamys,
        publicDreamys: this.publicDreamys,
        personalLoader: this.personalLoader,
        publicLoader: this.publicLoader,
      },
    );
  },
});