define(function (require) {
    'use strict';
    var msgCollectionView = require('./baseCollectionView'),
        MiniMsgView = require('./miniMsgView');
    return msgCollectionView.extend({
        className: 'minimsgs',
        MsgView: MiniMsgView
    });
});