import baseCollectionView from './baseCollectionView';
import MiniMsgView from './miniMsgView';

export default baseCollectionView.extend({
  className: 'minimsgs',
  MsgView: MiniMsgView,
  reverse: true,
});
