import msgCollectionView from './baseCollectionView';
const MiniMsgView = require('./miniMsgView');
export default msgCollectionView.extend({
  className: 'minimsgs',
  MsgView: MiniMsgView,
});
