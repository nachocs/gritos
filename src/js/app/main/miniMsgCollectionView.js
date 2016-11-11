define(function (require) {
    'use strict';
    import msgCollectionView from './baseCollectionView';
        MiniMsgView = require('./miniMsgView');
    return msgCollectionView.extend({
        className: 'minimsgs',
        MsgView: MiniMsgView
    });
});