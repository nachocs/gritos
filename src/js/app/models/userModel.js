define(function (require) {
    'use strict';
    import Backbone from 'backbone';
        UserModel = Backbone.Model.extend({
            idAttribute: 'ID'
        });
    return new UserModel(); // unique
});