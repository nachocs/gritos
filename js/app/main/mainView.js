define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        template = require('text!./mainView-t.html'),
        LoginView = require('./loginView'),
        MsgCollectionView = require('./msgCollectionView');
    return Backbone.View.extend({
        initialize: function (options) {
            this.msgCollectionView = new MsgCollectionView({
                collection: this.collection,
                userModel: options.userModel
            });
            this.listenTo(this.model, 'change:Name', _.bind(function () {
                this.collection.reset();
                this.collection.id = this.model.id;
                this.collection.fetch();
            }, this));
            this.userModel = options.userModel;
            this.loginView = new LoginView({
                userModel: this.userModel
            });
            this.listenTo(this.model, 'sync', this.render.bind(this));
        },
        className: "main",
        template: _.template(template),
        render: function () {
            this.$el.html(this.template(this.serializer()));
            this.$('.msg-list').replaceWith(this.msgCollectionView.render().el);
            this.$('.login-view').html(this.loginView.render().el);

            if (this.afterRender && typeof this.afterRender === 'function') {
                this.afterRender();
            }
            return this;
        },
        afterRender: function () {
            componentHandler.upgradeElement(this.$el.find('.mdl-js-layout')[0]);
            componentHandler.upgradeElement(this.$el.find('.mdl-js-button')[0]);

            _.defer(_.bind(function () {
                // debugger;
                // $(window).scroll(function () {
                //     debugger;
                // });
                // $('*').scroll(function () {
                //     debugger;
                // });
                // $('body div').scroll(function () {
                //     debugger;
                // });
                // $('body div div').scroll(function () {
                //     debugger;
                // });
                // $('body div div div').scroll(function () {
                //     debugger;
                // });

                $('.mdl-layout__content').scroll(this.detect_scroll.bind(this));
            }, this));
        },
        detect_scroll: function (e) {
            if (($(e.currentTarget).scrollTop() + window.innerHeight) > ($('.msg-list').height() - 200)) {
                this.collection.nextPage();
            }
        },
        serializer: function () {
            return this.model.toJSON();
        }

    });
});