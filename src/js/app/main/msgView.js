import BaseMsgView from './baseMsgView';
import MiniMsgCollection from '../models/msgCollection';
import MiniMsgCollectionView from './miniMsgCollectionView';

export default BaseMsgView.extend({
  MiniMsgCollection,
  MiniMsgCollectionView,
  showForm: true,
});
