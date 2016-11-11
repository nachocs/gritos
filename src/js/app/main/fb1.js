define(function (require) {
    'use strict';
    import FB from 'facebook';
        import $ from 'jquery';
        import userModel from '../models/userModel';

        dlogin = function (data) {
            var email = data.email;
            $.ajax({
                url: "http://gritos.com/jsgritos/api/emaillogin.cgi",
                dataType: 'json',
                type: 'POST',
                data: {
                    email: email,
                    access_token: FB.getAuthResponse().accessToken,
                    FBuserID: FB.getAuthResponse().userID,
                    FBuser: data
                },
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
        },

        fBlogin = function () {
            FB.login(function (response) {
                console.log("fb login response", response);
            }, {
                scope: 'email,publish_actions'
            });
        };

    FB.init({
        appId: '472185159492660',
        // cookie: true, // enable cookies to allow the server to access  the session
        status: true,
        xfbml: false, // parse social plugins on this page
        version: 'v2.2' // use version 2.2
    });
    FB.Event.subscribe('auth.authResponseChange', function (response) {
        console.log("response", response);
        if (response.status === 'connected') {
            $('#FB_login').hide();
            FB.api('/me', function (response) {
                console.log('Good to see you, ' + response.name + '.', response);
                dlogin(response);

            });
        } else if (response.status === 'not_authorized') {
            fBlogin();
        } else {
            fBlogin();
        }
    });
    FB.getLoginStatus(function (response) {
        // debugger;
    });


    return {
        init: function (options) {
            var self = this;

            $(document).on('click', '#FB_login', function (ev) {
                fBlogin();
            });

        },
        FBpost: function () {
            var obj = {
                message: "test message"
            };
            FB.api(
                'me/feed',
                'post', {
                    message: "test message",
                    picture: 'http://dreamers.com/imagenes/rotulin.gif',
                    link: 'http://dreamers.com',
                    name: 'dreamers test post',
                    privacy: {
                        'value': 'SELF'
                    }
                },
                function (response) {
                    if (!response) {
                        alert('Error occurred.');
                    } else if (response.error) {
                        console.log("error", response.error.message);
                    } else {
                        console.log("success", response.id);
                    }
                }
            );
        },
        // displayLogin: function (data) {
        //     //      $('#loginPlace').html(data.user.alias_principal);
        // }

    };

});