define(function (require) {
    'use strict';
    var BaseMsgView = require('./baseMsgView'),
        MsgCollection = require('../models/msgCollection'),
        MsgCollectionView = require('./miniMsgCollectionView');
    return BaseMsgView.extend({
        MiniMsgCollection: MsgCollection,
        MiniMsgCollectionView: MsgCollectionView
    });
});