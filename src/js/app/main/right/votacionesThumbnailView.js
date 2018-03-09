import ViewBase from '../base/ViewBase';
import template from './votacionesThumbnailView.html';
import _ from 'lodash';
import globalModel from '../../models/globalModel';
import VotacionesThumbnailModel from './votacionesThumbnailModel';
import router from '../../router';

//https://gritos.com/jsgritos/api/json.cgi?indice=gritos/avengers&encontrar=IMAGEN0_THUMB&max=1
//https://gritos.com/jsgritos/api/json.cgi?indice=ciudadanos/35331&encontrar=IMAGEN0_THUMB&max=1
export default ViewBase.extend({
  model: new VotacionesThumbnailModel(),
  template: _.template(template),
  className: 'right-block',
  events: {
    'click .gotovotaciones': 'goToVotaciones',
  },
  goToVotaciones() {
    let ruta = '/' + globalModel.get('ID') + '/votaciones';
    ruta = ruta.replace(/\/\//, '/');
    router.navigate(ruta, { trigger: true });
  },
  initialize() {
    this.listenTo(globalModel, 'change', () => {
      let id = globalModel.get('ID');
      if (id.match(/foroscomun/)) {
        id = null;
      } else if (id.match(/ciudadanos/)) {
        id = id.replace(/\/$/, '');
      } else {
        id = 'gritos/' + id;
      }
      this.model.set('indice', id);
      this.model.fetch({ cache: true });
    });
    this.listenTo(this.model, 'sync', this.render.bind(this));
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.delegateEvents();
    return this;
  },
  serializer() {
    const obj = this.model.toJSON();
    return Object.assign({}, obj, {
      comments: obj.comments && obj.comments.length > 50 ? obj.comments.substring(0, 50) + '...' : obj.comments,
    });
  },
});