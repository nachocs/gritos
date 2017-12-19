import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import Autolinker from 'autolinker';
import MolaView from './molaView';
import template from './msgView-t.html';
import FormView from '../form/formView';
import Util from '../../util/util';
import ModalView from '../modalView';
import PreviousMsgView from './previousMsgView';
import ViewBase from '../base/ViewBase';
import lazyImages from '../../util/lazyImages';

const youtube_parser = url => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
    match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
};
const autolinker = new Autolinker({
  replaceFn(match) {
    if (match.getType() === 'url') {
      if ((match.getUrl().indexOf('youtube.com') > 0) || (match.getUrl().indexOf('youtu.be') > 0)) {
        const youtubeId = youtube_parser(match.getUrl());
        return `<div class="videodelimitador"><div class="videocontenedor"><iframe title="youtube" src="//www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen=""></iframe></div></div>`;
      }
    } else {
      return;
    }
  },
});

export default ViewBase.extend({
  template: _.template(template),
  className: 'msg',
  initialize(options) {
    this.userModel = options.userModel;
    this.headModel = options.headModel;
    if (this.MiniMsgCollection) {
      const miniIndice = this.model.get('INDICE');
      // miniIndice = miniIndice.replace(/^.*\//,'');
      this.minimsgsCollection = new this.MiniMsgCollection([], {
        id: `${miniIndice}/${this.model.get('ID')}/`,
        msgModel: this.model,
      });
      // this.minimsgsCollection.comparator = (a,b) => (a.get('ID') - b.get('ID'));
      this.minimsgsCollectionView = new this.MiniMsgCollectionView({
        collection: this.minimsgsCollection,
        userModel: this.userModel,
        headModel: this.headModel,
      });
      this.previousMsgView = new PreviousMsgView({ collection: this.minimsgsCollection });
      this.listenTo(this.model, 'change:minimsgs', this.renderMiniMsgs.bind(this));
      this.listenTo(this.minimsgsCollection, 'reset', this.renderMiniMsgs.bind(this));
      this.listenTo(this.minimsgsCollection, 'add', this.renderMiniMsgs.bind(this));
    }
    this.molaView = new MolaView({
      model: this.model,
      userModel: this.userModel,
    });
    if (this.showForm) {
      this.formView = new FormView({
        userModel: this.userModel,
        collection: this.minimsgsCollection,
        parentModel: this.model,
        type: 'msg',
      });
    }
    this.listenTo(this.model, 'destroy', this.remove.bind(this));
    this.listenTo(this, 'remove', this.clean.bind(this));
    this.listenTo(this.userModel, 'change:ID', () => {
      if (this.$el) {
        this.miniMsgsAlreadyRendered = false;
        this.render();
      }
    });
    this.listenTo(this.model, 'change:comments', () => {
      this.miniMsgsAlreadyRendered = false;
      this.render();
    });
  },
  events: {
    'click .spoiler': 'openSpoiler',
    'click .show-admin': 'toggleAdminMenu',
    'click .js-ban': 'showBanModal',
    'click .js-delete': 'showDeleteModal',
    'click .js-edit': 'editThis',
    'click .share': 'openShare',
    'click .fa-facebook-official': 'shareFb',
    'click .fa-twitter-square': 'shareTw',
  },
  shareFb() {
    Util.bookmarkthis('facebook', 'https://gritos.com/' + this.model.get('INDICE').replace(/^gritos\//, '') + '/' + this.model.get('ID'), this.headModel.get('Title'));
  },
  shareTw() {
    Util.bookmarkthis('twitter', 'https://gritos.com/' + this.model.get('INDICE').replace(/^gritos\//, '') + '/' + this.model.get('ID'), this.headModel.get('Title'));
  },
  openShare(e) {
    e.preventDefault();
    e.stopPropagation();
    this.$(e.currentTarget).find('.share-menu').toggleClass('active');
  },
  editThis() {
    ModalView.update({
      model: {
        show: true,
        header: 'EDITAR GRITO',
      },
      editForm: {
        userModel: this.userModel,
        collection: this.model.collection,
        msg: this.model,
      },
    }, );
  },
  showBanModal() {
    ModalView.update({
      model: {
        show: true,
        header: '&iquest;ESTE GRITO APESTA?',
        body: '&iquest;Seguro que quieres denunciar este mensaje como basura?',
      },
      action: this.banThis.bind(this),
    }, );
  },
  showDeleteModal() {
    ModalView.update({
      model: {
        show: true,
        header: '&iquest;BORRAR GRITO?',
        body: '&iquest;Seguro que quieres borrar este mensaje?',
      },
      action: this.deleteThis.bind(this),
    }, );
  },
  deleteThis() {
    console.log('delete run');
    this.model.destroy();
  },
  banThis() {
    console.log('ban run');
  },
  toggleAdminMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    this.$(e.currentTarget).find('.admin-menu').toggleClass('active');
  },
  openSpoiler(e) {
    e.preventDefault();
    e.stopPropagation();
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

      w_t = this.$(e.currentTarget).find(tipr_cont).outerWidth();
      w_e = this.$(e.currentTarget).width();
      m_l = (w_e / 2) - (w_t / 2);
      // if (-m_l > this.$(e.currentTarget).position().left) {
      // m_l = m_l + this.$(e.currentTarget).position().left;
      // }
      h_t = -this.$(e.currentTarget).find(tipr_cont).height() - this.$(e.currentTarget).height() - 12;

      this.$(e.currentTarget).find(tipr_cont).css('margin-left', `${m_l}px`);
      this.$(e.currentTarget).find(tipr_cont).css('margin-top', `${h_t}px`);
      // paso dos veces porque cambia el alto al cambiar el margen
      w_t = this.$(e.currentTarget).find(tipr_cont).outerWidth();
      w_e = this.$(e.currentTarget).width();
      m_l = (w_e / 2) - (w_t / 2);
      h_t = -this.$(e.currentTarget).find(tipr_cont).height() - this.$(e.currentTarget).height() - 12;
      this.$(e.currentTarget).find(tipr_cont).css('margin-left', `${m_l}px`);
      this.$(e.currentTarget).find(tipr_cont).css('margin-top', `${h_t}px`);

      this.$(this).removeAttr('title alt');

      this.$(e.currentTarget).find(tipr_cont).fadeIn('300');
      this.$(e.currentTarget).addClass('spoiler-on');
    }
  },
  formatComments(string) {
    if (!string) {
      return string;
    }
    const replacer = (match, p1) => {
      p1 = p1.replace(/\"/ig, '&quot;');
      return ` <span class="spoiler" data-tip="${p1}">SPOILER</span> `;
    };

    string = string.replace(/\-\:SPOILER\[([^\]\[]+)\]SPOILER\:\-/ig, replacer);
    return autolinker.link(string);
  },

  renderMiniMsgs() {
    if (this.minimsgsCollectionView && !this.miniMsgsAlreadyRendered) {
      this.$('.previous-msgs-view').html(this.previousMsgView.render().el);
      this.$('.minimsgs').replaceWith(this.minimsgsCollectionView.render().el);
      this.minimsgsCollection.fetch();
      this.miniMsgsAlreadyRendered = true;
    }
    return this;
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    if (this.showForm) {
      this.$('.mini-form').html(this.formView.render().el);
    }
    if (this.model.get('minimsgs')) {
      this.renderMiniMsgs();
    }
    this.$('.mola-view').first().replaceWith(this.molaView.render().el);
    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    this.delegateEvents();
    return this;
  },
  afterRender() {
    const self = this;
    if (self.$el.find('.icon').length > 0) {
      setTimeout(() => {
        componentHandler.upgradeElement(self.$el.find('.icon')[0]);
      }, 100);
    }
    this.materialDesignUpdate();
    if (this.isCarousel) {
      setTimeout(() => {
        this.$('.images-place').slick({
          dots: true,
          infinite: true,
          speed: 300,
          slidesToShow: this.isCarousel < 3 ? this.isCarousel : 3,
          slidesToScroll: this.isCarousel < 3 ? this.isCarousel : 3,
          arrows: true,
          adaptiveHeight: true,
          responsive: [{
              breakpoint: 1024,
              settings: {
                slidesToShow: this.isCarousel < 3 ? this.isCarousel : 3,
                slidesToScroll: this.isCarousel < 3 ? this.isCarousel : 3,
                infinite: true,
                dots: true,
              },
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 2,
              },
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              },
            },
            // You can unslick at a given breakpoint now by adding:
            // settings: "unslick"
            // instead of a settings object
          ],
        });
      }, 200);
    }
    this.loadLazyImages();
  },
  loadLazyImages() {
    const images = this.$('.js-lazy-image');
    if (images.length > 0) {
      lazyImages.apply(images.get());
    }
  },
  serializer() {
    let tagsShown = [],
      value, mainName;
    if (this.model.get('publicados')) {
      _.each(this.model.get('publicados').split(/\|/), (pub) => {
        value = pub.split(/\,/)[1];
        if (value) {
          value = value.replace(/^gritos\//, '');
          tagsShown.push({
            name: pub.split(/\,/)[0],
            value,
          });
        }
      });
    }
    if (!this.model.get('INDICE').match(/^ciudadanos\//)) {
      mainName = this.model.get('INDICE');
      mainName = mainName.replace(/^gritos\//, '').replace(/^foros\//, '');
      tagsShown.push({
        name: mainName,
        value: mainName,
      });
    }
    if (this.model.get('INDICE').match(/^ciudadanos\//) && this.model.get('indice_ciudadano_alias')) {
      mainName = this.model.get('INDICE');
      tagsShown.push({
        name: this.model.get('indice_ciudadano_alias').replace(/\s/g, '_'),
        value: mainName,
      });
    }
    tagsShown = _.uniqBy(tagsShown, 'value');
    let images = [];
    Object.keys(this.model.toJSON()).forEach((key) => {
      if ((/IMAGEN(\d+)_URL/).exec(key)) {
        const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        images.push(Util.displayImage(this.model.toJSON(), image));
      }
    });
    this.isCarousel = (images.length > 1) ? images.length : null;
    if (this.isCarousel) {
      images = [];
      Object.keys(this.model.toJSON()).forEach((key) => {
        if ((/IMAGEN(\d+)_URL/).exec(key)) {
          const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
          images.push(Util.displayImage2(this.model.toJSON(), image));
        }
      });

    }

    return _.extend({}, this.model.toJSON(), {
      date: moment.unix(this.model.get('FECHA')).fromNow(true),
      comments: this.formatComments(this.model.get('comments')),
      tagsShown,
      showForm: this.showForm,
      images,
      userModel: this.userModel.toJSON(),
      headModel: this.headModel.toJSON(),
      emocion: this.model.get('emocion') && this.model.get('emocion').replace('http:', ''),
    });
  },
  clean() {
    this.formView && this.formView.trigger('remove');
    if (this.minimsgsCollectionView) {
      this.minimsgsCollectionView.remove();
      delete this.minimsgsCollectionView;
    }
    this.molaView && this.molaView.remove();

    // delete this.formView;
    // delete this.molaView;
    for (const prop of Object.keys(this)) {
      delete this[prop];
    }
  },
});