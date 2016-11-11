define(function (require) {
    'use strict';
    import msgCollectionView from './baseCollectionView';
        MsgView = require('./msgView');
    return msgCollectionView.extend({
        className: 'msg-list',
        MsgView: MsgView
    });
});