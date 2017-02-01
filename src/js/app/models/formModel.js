import Backbone from 'backbone';
import endpoints from '../util/endpoints';
import Ws from '../util/Ws';

export default  Backbone.Model.extend({
  url: endpoints.apiUrl + 'post.cgi',
  defaults: {
    comments: '',
  },
  initialize(){
    this.listenTo(this, 'sync', () => {
      if (this.room){
        Ws.update('collection:' + this.room);
      }
    });
  },
  save(attrs){
    if (attrs.minigrito){
      this.room = attrs.minigrito.indice + '/' + attrs.minigrito.entrada;
    } else if (attrs.foro){
      this.room = attrs.foro;
    }
    return Backbone.Model.prototype.save.apply(this, arguments);
  },
});
