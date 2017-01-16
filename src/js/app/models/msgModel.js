import Backbone from 'backbone';
import vent from '../vent';
import endpoints from '../endpoints';
import Ws from '../Ws';

export default Backbone.Model.extend({
  initialize(){
    vent.on('msg_' + this.get('INDICE') + '/' + this.get('ID'), data => {
      this.set(data.entry);
      console.log('updated msg', data.room, data.entry);
    });
    this.listenTo('sync', () => {
      if (this.get('INDICE') && this.get('ID')){
        Ws.update(this.get('INDICE') + '/' + this.get('ID'));
      }
    });
  },
  idAttribute: 'ID',
  url() {
    return endpoints.apiUrl + 'index.cgi?' + this.get('INDICE') + '/' + this.get('ID');
  },
});
