define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        $ = require('jquery'),
        Router = require('./router'),
        MainView = require('./main/mainView'),
        MsgCollection = require('./models/msgCollection'),
        HeadModel = require('./models/headModel'),
        moment = require('moment'),
        Fb = require('./main/fb'),
        userModel = require('./models/userModel'),
        App = Backbone.View.extend({
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
    return App;
});