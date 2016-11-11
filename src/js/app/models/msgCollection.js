define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        model = require('./msgModel');
    return Backbone.Collection.extend({
        model: model,
        initialize: function (models, options) {
            if (options && options.id) {
                this.id = options.id;
            }
            this.lastEntry = 0;
            this.listenTo(this, 'sync', _.bind(function () {
                this.loading = false;
            }, this));
            this.listenTo(this, 'error', _.bind(function () {
                this.loading = false;
            }, this));
            this.listenTo(this, 'request', _.bind(function () {
                this.loading = true;
            }, this));
        },
        sort: 'ID',
        url: function () {
            return 'http://gritos.com/jsgritos/api/index.cgi?' + this.id;
        },
        nextPage: function () {
            if (!this.loading) {
                this.fetch({
                    data: {
                        init: this.lastEntry
                    },
                    remove: false
                });
            }
        },
        parse: function (resp, options) {
            this.lastEntry = Math.min.apply(null, _.pluck(resp, 'num'));
            return resp;
        }
    });

});