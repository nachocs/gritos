import Backbone from 'backbone';
import $ from 'jquery';
import Router from './router';
import MainView from './main/mainView';
import MsgCollection from './models/msgCollection';
import HeadModel from './models/headModel';
import moment from 'moment';
import GlobalModel from './models/globalModel';
import userModel from './models/userModel';
import ResumenCollection from './models/resumenCollection';
import Slick from 'slick-carousel';

const App = Backbone.View.extend({
  initialize() {
    this.initialSetup();
    this.slick = Slick;
    this.globalModel = new GlobalModel();
    this.headModel = new HeadModel({},{globalModel:this.globalModel});
    this.msgCollection = new MsgCollection([],{globalModel:this.globalModel});
    this.resumenCollection = new ResumenCollection();
    this.resumenCollection.fetch();

    this.mainView = new MainView({
      collection: this.msgCollection,
      model: this.headModel,
      userModel,
      resumenCollection: this.resumenCollection,
      globalModel: this.globalModel,
    });
    $('#root').html(this.mainView.render().el);
    this.router = new Router({
      model: this.globalModel,
    });
    Backbone.history.start({pushState: false, root:''});
  },
  initialSetup() {
    moment.locale('es');
    const proxiedSync = Backbone.sync;
    Backbone.sync = (method, model, options) => {
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
