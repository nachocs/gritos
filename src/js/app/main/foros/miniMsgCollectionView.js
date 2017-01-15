import baseCollectionView from './baseCollectionView';
import MiniMsgView from '../message/miniMsgView';

export default baseCollectionView.extend({
  className: 'minimsgs',
  MsgView: MiniMsgView,
  reverse: true,
});
