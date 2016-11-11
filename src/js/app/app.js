import Backbone from 'backbone';
import $ from 'jquery';
import Router from './router';
import MainView from './main/mainView';
import MsgCollection from './models/msgCollection';

import HeadModel from './models/headModel';
import moment from 'moment';
import Fb from './main/fb';
import userModel from './models/userModel';
const App = Backbone.View.extend({
  initialize: function () {
      this.initialSetup();
      this.msgCollection = new MsgCollection();
      this.headModel = new HeadModel();

      this.fb = new Fb();
      this.mainView = new MainView({
          collection: this.msgCollection,
          model: this.headModel,
          userModel: userModel
      });
      $('body').html(this.mainView.render().el);
      this.router = new Router({
          model: this.headModel
      });
      Backbone.history.start();
  },
  initialSetup: function () {
      moment.locale('es');
      var proxiedSync = Backbone.sync;
      Backbone.sync = function (method, model, options) {
          options = options || {};
          if (!options.crossDomain) {
              options.crossDomain = true;
          }
          // if (!options.xhrFields) {
          //     options.xhrFields = {
          //         withCredentials: true
          //     };
          // }
          return proxiedSync(method, model, options);
      };
  }
});
export default App;
