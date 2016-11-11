define(function (require) {
    'use strict';
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery');
    return Backbone.Model.extend({
        // url: function () {
        //     return 'http://gritos.com/jsgritos/api/head.cgi?' + this.id;
        // },
        idAttribute: 'Name',
        urlRoot: 'http://gritos.com/jsgritos/api/head.cgi'
    });

});