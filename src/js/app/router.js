define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        $ = require('jquery');
    return Backbone.Router.extend({
        routes: {
            ":foro": "foro",
            ":foro/:id": "mensaje"
        },
        initialize: function (options) {
            this.model = options.model;
            // options.collection.fetch();
        },
        foro: function (foro) {
            this.model.set({
                Name: foro
            });
            this.model.fetch();
        },
        mensaje: function (foro, mensajeId) {
            debugger;
        }
    });
});