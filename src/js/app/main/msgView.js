define(function (require) {
    'use strict';
    import BaseMsgView from './baseMsgView';
        import MsgCollection from '../models/msgCollection';
        MsgCollectionView = require('./miniMsgCollectionView');
    return BaseMsgView.extend({
        MiniMsgCollection: MsgCollection,
        MiniMsgCollectionView: MsgCollectionView
    });
});