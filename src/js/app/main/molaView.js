define(function (require) {
    'use strict';
    import Backbone from 'backbone';
        import template from 'text!./molaView-t.html';
        _ = require('underscore');
    return Backbone.View.extend({
        template: _.template(template),
        className: 'mola',
        initialize: function (options) {
            this.userModel = options.userModel;
            this.listenTo(this.userModel, 'change', this.render.bind(this));
            this.listenTo(this.model, 'change:mola', this.render.bind(this));
            this.listenTo(this.model, 'change:nomola', this.render.bind(this));
        },
        events: {
            'click i': 'molaAction'
        },
        molaAction: function (e) {
            var mola = this.$(e.currentTarget).hasClass('mola') ? "mola" : "nomola",
                molaTag = mola + "." + this.clean(this.model.get('INDICE') + "." + this.model.id),
                userObj = {},
                modelObj = {};
            userObj[molaTag] = (!this.userModel.get(molaTag)) ? 1 : null;
            this.userModel.set(userObj, {
                patch: true
            });
            modelObj[mola] = Number(this.model.get(mola) || 0) + (userObj[molaTag] ? 1 : -1);
            this.model.save(modelObj
                // {                patch: true            }
            );
        },
        render: function () {
            if (this.userModel && this.userModel.id) {
                this.$el.html(this.template(this.serializer()));
            }
            return this;
        },
        serializer: function () {
            return _.extend({},
                this.model.toJSON(), {
                    user: this.userModel.toJSON(),
                    currentMola: this.userModel.get("mola." + this.clean(this.model.get('INDICE') + "." + this.model.id)),
                    currentNomola: this.userModel.get("nomola." + this.clean(this.model.get('INDICE') + "." + this.model.id))
                });
        },
        clean: function (string) {
            return string.replace(/\//ig, ".");
        }

    });
});