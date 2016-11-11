import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import moment from 'moment';
import Autolinker from 'autolinker';
import MolaView from './molaView';
import template from 'text!./msgView-t.html';
const youtube_parser = url => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
    match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
};
const autolinker = new Autolinker({
  replaceFn (autolinker, match) {
    if (match.getType() === 'url') {
      if ((match.getUrl().indexOf('youtube.com') > 0) || (match.getUrl().indexOf('youtu.be') > 0)) {
        const youtubeId = youtube_parser(match.getUrl());
        return `<div class="videodelimitador"><div class="videocontenedor"><iframe src="http://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen=""></iframe></div></div>`;
      }
    } else {
      return;
    }
  },
});

export default Backbone.View.extend({
  template: _.template(template),
  className: 'msg',
  events: {
    'click .spoiler': 'openSpoiler',
  },
  initialize(options) {
    this.userModel = options.userModel;
    if (this.MiniMsgCollection) {
      this.minimsgsCollection = new this.MiniMsgCollection([], {
        id: `${this.model.collection.id}/${this.model.id}/`,
      });
      this.minimsgsCollectionView = new this.MiniMsgCollectionView({
        collection: this.minimsgsCollection,
        userModel: this.userModel,
      });
      this.listenTo(this.model, 'change:minimsgs', this.renderMiniMsgs.bind(this));
    }
    this.molaView = new MolaView({
      model: this.model,
      userModel: this.userModel,
    });
  },
  renderMiniMsgs() {
    this.$('.minimsgs').replaceWith(this.minimsgsCollectionView.render().el);
    this.minimsgsCollection.fetch();
    return this;
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    if (this.model.get('minimsgs')) {
      this.renderMiniMsgs();
    }
    this.$('.mola').replaceWith(this.molaView.render().el);
    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    return this;
  },
  afterRender() {
    const self = this;
    setTimeout(() => {
      componentHandler.upgradeElement(self.$el.find('.icon')[0]);
      // self.$('.spoiler').tipr({
      //     mode: 'top'
      // });
    }, 100);
  },
  openSpoiler(e) {
    const spoiler = $(e.currentTarget).attr('data-tip');
    const d_m = 'top';
    let w_t;
    let w_e;
    let h_t;
    let m_l;
    let out;
    const tipr_cont = `.tipr_container_${d_m}`;
    if ($(e.currentTarget).hasClass('spoiler-on')) {
      this.$(e.currentTarget).find(tipr_cont).fadeToggle();
    } else {
      out = `<div class="tipr_container_${d_m}"><div class="tipr_point_${d_m}"><div class="tipr_content">${spoiler}</div></div></div>`;
      this.$(e.currentTarget).append(out);

      w_t = this.$(tipr_cont).outerWidth();
      w_e = this.$(e.currentTarget).width();
      m_l = (w_e / 2) - (w_t / 2);
      if (-m_l > this.$(e.currentTarget).position().left) {
        m_l = m_l + this.$(e.currentTarget).position().left;
      }
      h_t = -this.$(tipr_cont).outerHeight() - this.$(e.currentTarget).height() - 8;

      this.$(tipr_cont).css('margin-left', `${m_l}px`);
      this.$(tipr_cont).css('margin-top', `${h_t}px`);
      this.$(this).removeAttr('title alt');

      this.$(tipr_cont).fadeIn('300');
      this.$(e.currentTarget).addClass('spoiler-on');
    }
  },
  formatComments(string) {
    if (!string) {
      return string;
    }
    const replacer = (match, p1) => ` <span class="spoiler" data-tip="${p1}">SPOILER</span> `;

    string = string.replace(/\-\:SPOILER\[([^\]\[]+)\]SPOILER\:\-/ig, replacer);
    return autolinker.link(string);
  },
  serializer() {
    return _.extend({}, this.model.toJSON(), {
      date: moment.unix(this.model.get('FECHA')).fromNow(),
      comments: this.formatComments(this.model.get('comments')),
    });
  },
});
