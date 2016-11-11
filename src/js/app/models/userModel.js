define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        UserModel = Backbone.Model.extend({
            idAttribute: 'ID'
        });
    return new UserModel(); // unique
});