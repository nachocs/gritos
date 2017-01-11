import Backbone from 'backbone';
import $ from 'jquery';
import Router from './router';
import MainView from './main/mainView';
import MsgCollection from './models/msgCollection';

import HeadModel from './models/headModel';
import moment from 'moment';

import userModel from './models/userModel';
const App = Backbone.View.extend({
  initialize() {
    this.initialSetup();
    this.headModel = new HeadModel();
    this.msgCollection = new MsgCollection([],{headModel:this.headModel});

    this.mainView = new MainView({
      collection: this.msgCollection,
      model: this.headModel,
      userModel,
    });
    $('#root').html(this.mainView.render().el);
    this.router = new Router({
      model: this.headModel,
    });
    Backbone.history.start({pushState: false, root:''});
  },
  initialSetup() {
    moment.locale('es');
    const proxiedSync = Backbone.sync;
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
  },
});
export default new App();
