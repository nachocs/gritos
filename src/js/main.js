(function () {
    'use strict';
    requirejs.config({
        //By default load any module IDs from js/lib
        baseUrl: 'js/',
        //except, if the module ID starts with "app",
        //load it from the js/app directory. paths
        //config is relative to the baseUrl, and
        //never includes a ".js" extension since
        //the paths config could be for a directory.
        paths: {
            jquery: 'lib/jquery-2.1.4',
            underscore: 'lib/lodash',
            backbone: 'lib/backbone',
            moment: "lib/moment-with-locales",
            autolinker: "lib/Autolinker.js-master/dist/Autolinker",
            facebook: '//connect.facebook.net/en_US/all'
        },
        shim: {
            underscore: {
                exports: '_'
            },
            backbone: {
                deps: ['underscore', 'jquery'],
                exports: 'Backbone'
            },
            facebook: {
                exports: 'FB'
            }
        }
    });
    window.fbAsyncInit = function () {
        FB.init({
            appId: '472185159492660',
            // cookie: true, // enable cookies to allow the server to access  the session
            // status: true,
            // xfbml: false, // parse social plugins on this page
            // version: 'v2.2' // use version 2.2
        });
    };

    // Start the main app logic.
    define(function (require) {
        var import $ from 'jquery';
            App = require('app/app');

        $(function () {
            var app = new App();
        });

    });

}());