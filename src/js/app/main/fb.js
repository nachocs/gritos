// import FB from 'fb';
import _ from 'lodash';
import $ from 'jquery';
import Backbone from 'backbone';
import FacebookUser from './FacebookUser';
import userModel from '../models/userModel';
import endpoints from '../util/endpoints';

export default Backbone.View.extend({
  initialize() {
    const fBuser = new FacebookUser({}, {
      scope: ['email', 'public_profile', 'user_friends'],
    });
    fBuser.on('facebook:connected', _.bind((model, res) => {
      console.log('connected', res);
    }, this));
    fBuser.on('change', this.dLogin.bind(this));
    fBuser.updateLoginStatus();


    $(document).on('click', '#FB_login', _.bind(() => {
      fBuser.login();
    }, this));
  },
  dLogin(model) {
    console.log('dLogin');
    const email = model.get('email'),
      payload = {
        email,
        access_token: FB.getAuthResponse().accessToken,
        FBuserID: FB.getAuthResponse().userID,
        FBuser: model.toJSON(),
      };
    $.ajax({
      url: endpoints.apiUrl + 'emaillogin.cgi',
      dataType: 'json',
      type: 'POST',
      data: payload,
      success(res) {
        console.log('Respuesta de dreamers', res);
        userModel.set(res.user);
        userModel.set('sessionId', res.uid);
        // $D.user = $D.user || {};
        // $D.user.sessionId = res.uid;
        // self.displayLogin(res);
        //  self.FBpost();
      },
    });
  },
});
