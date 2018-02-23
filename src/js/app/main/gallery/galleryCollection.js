import Backbone from 'backbone';
import globalModel from '../../models/globalModel';
import model from '../../models/msgModel';

export default Backbone.Collection.extend({
  model,
  initialize() {
    // this.listenTo(globalModel, 'change', () => {
    // });
  },
  url() {
    this.indice = this.getIndice();
    if (this.indice) {
      return 'https://gritos.com/jsgritos/api/json.cgi?indice=' + this.indice + '&encontrar=IMAGEN0_THUMB&max=1';
    }
  },
  getIndice() {
    let id = globalModel.get('ID');
    if (id) {
      if (id.match(/foroscomun/)) {
        id = null;
      } else if (id.match(/ciudadanos/)) {
        id = id.replace(/\/$/, '');
      } else {
        id = 'gritos/' + id;
      }
      return id;
    }
  },
});