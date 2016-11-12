import BaseMsgView from './baseMsgView';
import MsgCollection from '../models/msgCollection';
const MsgCollectionView = require('./miniMsgCollectionView');
export default BaseMsgView.extend({
  MiniMsgCollection: MsgCollection,
  MiniMsgCollectionView: MsgCollectionView,
});
