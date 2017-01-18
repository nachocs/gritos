import Backbone from 'backbone';
import endpoints from '../util/endpoints';
import Ws from '../util/Ws';

export default  Backbone.Model.extend({
  url: endpoints.apiUrl + 'post.cgi',
  defaults: {},
  initialize(){
    this.listenTo(this, 'sync', () => {
      if (this.room){
        Ws.update('collection:' + this.room);
      }
    });
  },
  save(attrs){
    if (attrs.room){
      this.room = attrs.room;
    }
    return Backbone.Model.prototype.save.apply(this, arguments);
  },
});
