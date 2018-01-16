import ViewBase from '../base/ViewBase';
import _ from 'lodash';
import template from './profileView.html';
import userModel from '../../models/userModel';
import endpoints from '../../util/endpoints';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/operator/map';

export default ViewBase.extend({
  template: _.template(template),
  events: {},
  initialize(options) {
    this.close = options.close;
    this.model = userModel;
    this.getDreamys();
    this.publicDreamys = [];
    this.personalDreamys = [];
    this.personalLoader = true;
    this.publicLoader = true;
  },
  getDreamys() {
    this.publicLoader = true;
    this.$('.loader').addClass('active');
    const url = 'json.cgi?indice=dreamys&encontrar=public';
    if (this.model.get('uid')) {
      this.getPresonalDreamys();
    }
    const gets$ = Observable
      .ajax(endpoints.apiUrl + url)
      .map(e => e.response);
    gets$.subscribe(data => {
      this.publicLoader = false;
      this.publicDreamys = data;
      this.render();
    });
  },
  getPresonalDreamys() {
    this.personalLoader = true;
    this.$('.loader').addClass('active');
    const url = 'json.cgi?indice=dreamys&encontrar=ciudadano=' + this.model.get('NID');
    const gets$ = Observable
      .ajax(endpoints.apiUrl + url)
      .map(e => e.response);
    gets$.subscribe(data => {
      this.personalLoader = false;
      this.personalDreamys = data;
      this.render();
    });
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