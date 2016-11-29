import BaseMsgView from './baseMsgView';
import MsgCollection from '../models/msgCollection';
import MsgCollectionView from './miniMsgCollectionView';

export default BaseMsgView.extend({
  MiniMsgCollection: MsgCollection,
  MiniMsgCollectionView: MsgCollectionView,
});
