define(function (require) {
    'use strict';
    import Backbone from 'backbone';
        import _ from 'underscore';
        import $ from 'jquery';
        import MenuLoginView from './menuLoginView';
        template = require('text!./loginView-t.html');

    return Backbone.View.extend({
        template: _.template(template),
        initialize: function (options) {
            this.menuLoginView = new MenuLoginView();
            this.model = options.userModel;
            this.listenTo(this.model, 'change', this.render.bind(this));
        },
        events: {
            'click #loginSubmit': 'submit',
            'click input': function (e) {
                e.preventDefault();
                e.stopPropagation();
            },
            'click .login-menu-button': 'openMenu'
        },
        openMenu: function () {
            this.$('.login-menu').toggleClass('hidden');
        },
        submit: function () {
            var alias = this.$('#loginAlias').val(),
                pass = this.$('#loginPassword').val();
            if ((alias.length < 1) || (pass.length < 1)) {
                console.log('te olvidaste de poner algo'); // TODO
            } else {
                $.ajax({
                    type: "POST",
                    url: "api/login.cgi",
                    data: {
                        alias: alias,
                        password: pass
                    },
                    success: function (data) {
                        if (data.status !== 'ok') {
                            console.log("error: ", data.status);
                        }
                    }
                });
            }
        },
        render: function () {
            var self = this;
            this.$el.html(this.template(this.model.toJSON()));
            _.defer(function () {
                self.$el.find('[class*=" mdl-js"]').each(function () {
                    componentHandler.upgradeElement(this);
                });
            });

            this.delegateEvents();

            return this;
        }
    });

});