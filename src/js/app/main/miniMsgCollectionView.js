import msgCollectionView from './baseCollectionView';
import MiniMsgView from './miniMsgView';

export default msgCollectionView.extend({
  className: 'minimsgs',
  MsgView: MiniMsgView,
});
