// https://github.com/fabrik42/facebook-user.js
import Backbone from 'backbone';
import _ from 'underscore';
import FB from 'fb';

const FacebookUser = Backbone.Model.extend({

  initialize(attributes, options) {
    options || (options = {});
    this.options = _.defaults(options, this.defaultOptions);

    _.bindAll(this, 'onLoginStatusChange');

    FB.Event.subscribe('auth.authResponseChange', this.onLoginStatusChange);
  },

  options: null,

  defaultOptions: {
    // see https://developers.facebook.com/docs/authentication/permissions/
    scope: [], // fb permissions
    autoFetch: true, // auto fetch profile after login
    protocol: location.protocol,
  },

  _loginStatus: null,

  isConnected() {
    return this._loginStatus === 'connected';
  },

  login(callback) {
    if (typeof callback === 'undefined') {
      callback = () => {};
    }
    FB.login(callback, {
      scope: this.options.scope.join(','),
    });
  },

  logout() {
    FB.logout();
  },

  updateLoginStatus() {
    FB.getLoginStatus(this.onLoginStatusChange);
  },

  onLoginStatusChange(response) {
    if (this._loginStatus === response.status) {
      return false;
    }

    let event;

    if (response.status === 'not_authorized') {
      event = 'facebook:unauthorized';
    } else if (response.status === 'connected') {
      event = 'facebook:connected';
      if (this.options.autoFetch === true) {
        this.fetch();
      }
    } else {
      event = 'facebook:disconnected';
    }

    this._loginStatus = response.status;
    this.trigger(event, this, response);
  },

  parse(response) {
    const attributes = _.extend(response, {
      pictures: this.profilePictureUrls(response.id),
    });

    return attributes;
  },

  sync(method, model, options) {
    if (method !== 'read') {
      throw new Error('FacebookUser is a readonly model, cannot perform ' + method);
    }

    const callback = response => {
        if (response.error) {
          options.error(response);
        } else {
          options.success(response);
        }
        return true;
      },
      request = FB.api('/me', callback);
    model.trigger('request', model, request, options);
    return request;
  },

  profilePictureUrls(id) {
    id || (id = this.id);
    const urls = {};
    _(['square', 'small', 'normal', 'large']).each(function (size) {
      urls[size] = this.profilePictureUrl(id, size);
    }, this);

    return urls;
  },

  profilePictureUrl(id, size) {
    return [
      this.options.protocol,
      '//graph.facebook.com/',
      id,
      '/picture?type=',
      size,
      this.options.protocol.indexOf('https') > -1 ? '&return_ssl_resources=1' : '',
    ].join('');
  },

});

export default FacebookUser;
