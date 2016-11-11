define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery');
    return Backbone.View.extend({
        initialize: function (options) {
            this.userModel = options.userModel;
            this.listenTo(this.collection, 'reset', this.render.bind(this));
            this.listenTo(this.collection, 'add', this.renderOne.bind(this));
            $(this.el).scroll(function () {
                debugger;
            });

        },
        render: function () {
            this.$el.html('');
            this.collection.each(function (model) {
                this.renderOne(model);
            }, this);
            return this;
        },
        renderOne: function (model) {
            var msgView = new this.MsgView({
                model: model,
                userModel: this.userModel
            });
            this.$el.append(msgView.render().el);
            componentHandler.upgradeElement(this.el);
        }
    });

});