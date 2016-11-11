define(function (require) {
    'use strict';
    var msgCollectionView = require('./baseCollectionView'),
        MsgView = require('./msgView');
    return msgCollectionView.extend({
        className: 'msg-list',
        MsgView: MsgView
    });
});