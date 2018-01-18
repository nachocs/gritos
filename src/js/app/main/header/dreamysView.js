import ViewBase from '../base/ViewBase';
import _ from 'lodash';
import template from './dreamysView.html';
import userModel from '../../models/userModel';
import DreamysService from '../../util/dreamysService';
import { Subscription } from 'rxjs/Subscription';

export default ViewBase.extend({
  template: _.template(template),
  events: {
    'click .select-dreamy': 'selectDreamy',
  },
  selectDreamy(e) {
    e.preventDefault();
    e.stopPropagation();
    const img = e.target.src;
    if (this.model.get('uid')) {
      this.close();
      this.model.save('dreamy_principal', img);
    }
  },
  initialize(options) {
    this.subscription = new Subscription();

    this.close = options.close;
    this.model = userModel;
    // this.getDreamys();
    this.publicDreamys = [];
    this.personalDreamys = [];
    this.personalLoader = true;
    this.publicLoader = true;
    this.subscription.add(
      DreamysService.getGeneralDreamys().subscribe((data => {
        this.publicLoader = false;
        this.publicDreamys = [...data];
        this.render();
      })));
    if (this.model.get('uid')) {
      this.subscription.add(
        DreamysService.getPersonalDreamys().subscribe((data => {
          this.personalLoader = false;
          this.personalDreamys = [...data];
          if (this.model.get('FB_picture')) {
            this.personalDreamys.unshift({
              IMAGEN1_URL: this.model.get('FB_picture'),
              subject: 'FB profile',
            });
          }
          this.render();
        })));
      DreamysService.fetchGeneralDreamys();
      DreamysService.fetchPersonalDreamys(this.model.get('ID'));
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
  borrar() {
    this.subscription.unsubscribe();
    this.remove();
  },
});