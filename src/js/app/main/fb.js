define(function (require) {
    'use strict';
    var FB = require('facebook'),
        _ = require('underscore'),
        $ = require('jquery'),
        Backbone = require('backbone'),
        FacebookUser = require('./FacebookUser'),
        userModel = require('../models/userModel');



    return Backbone.View.extend({
        initialize: function (options) {
            var fBuser = new FacebookUser({}, {
                scope: ['email', 'public_profile', 'user_friends']
            });
            fBuser.on('facebook:connected', _.bind(function (model, res, options) {
                console.log("connected", res);
            }, this));
            fBuser.on('change', this.dLogin.bind(this));
            fBuser.updateLoginStatus();


            $(document).on('click', '#FB_login', _.bind(function (ev) {
                fBuser.login();
            }, this));
        },
        dLogin: function (model) {
            console.log("dLogin");
            var email = model.get('email'),
                self = this,
                payload = {
                    email: email,
                    access_token: FB.getAuthResponse().accessToken,
                    FBuserID: FB.getAuthResponse().userID,
                    FBuser: model.toJSON()
                };
            $.ajax({
                url: "http://gritos.com/jsgritos/api/emaillogin.cgi",
                dataType: 'json',
                type: 'POST',
                data: payload,
                success: function (res) {
                    console.log("Respuesta de dreamers", res);
                    userModel.set(res.user);
                    userModel.set('sessionId', res.uid);
                    // $D.user = $D.user || {};
                    // $D.user.sessionId = res.uid;
                    // self.displayLogin(res);
                    //  self.FBpost();
                }
            });
        }
    });
});