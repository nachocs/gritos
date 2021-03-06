import Backbone from 'backbone';
import $ from 'jquery';
import Router from './router';
import MainView from './main/mainView';
import MsgCollection from './models/msgCollection';
import HeadModel from './models/headModel';
import moment from 'moment';
import globalModel from './models/globalModel';
import userModel from './models/userModel';
import ResumenCollection from './models/resumenCollection';
import Slick from 'slick-carousel';
import 'backbone-fetch-cache';

const App = Backbone.View.extend({
  initialize() {
    this.initialSetup();
    this.slick = Slick;

    this.headModel = new HeadModel({}, { globalModel });
    this.msgCollection = new MsgCollection([], { globalModel });
    this.resumenCollection = new ResumenCollection();
    this.resumenCollection.fetch();

    this.mainView = new MainView({
      collection: this.msgCollection,
      model: this.headModel,
      userModel,
      resumenCollection: this.resumenCollection,
      globalModel,
    });
    $('#root').html(this.mainView.render().el);
    this.router = Router;
    Backbone.history.start({ pushState: true, root: '/' });
    $('body').on('click', 'a', (e) => {
      const route = e.currentTarget.getAttribute('href');
      if (!route.match(/^http/) && !route.match(/^\/\//) && !route.match(/^mailto/) && !route.match(/^tel\:/)) {
        e.preventDefault();
        e.stopPropagation();
        this.router.navigate(route, { trigger: true });
      }
    });
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