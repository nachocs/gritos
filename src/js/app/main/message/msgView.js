import BaseMsgView from './baseMsgView';
import MiniMsgCollection from '../../models/msgCollection';
import MiniMsgCollectionView from '../foros/miniMsgCollectionView';

export default BaseMsgView.extend({
  MiniMsgCollection,
  MiniMsgCollectionView,
  showForm: true,
});
